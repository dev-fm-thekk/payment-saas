import { Project, SyntaxKind, VariableDeclarationKind } from "ts-morph";
import * as fs from "fs";
import * as path from "path";

const srcDir = path.join(__dirname, "src");
const routesDir = path.join(srcDir, "routes");
const servicesDir = path.join(srcDir, "services");
const controllersDir = path.join(srcDir, "controllers");

if (!fs.existsSync(controllersDir)) {
    fs.mkdirSync(controllersDir);
}

const apiMap: Record<string, string> = {
    "Auth": "auth",
    "Company": "company",
    "CompanyService": "company-service",
    "Provider": "provider",
    "User": "user",
    "Webhook": "webhook",
    "transactions": "transactions"
};

// Also we have services that need to be moved to controllers/<Api>/<api>.helper.ts
const servicesMap: Record<string, { api: string, file: string }> = {
    "Auth/auth.service.ts": { api: "Auth", file: "auth.helper.ts" },
    "Auth/user.service.ts": { api: "User", file: "user.helper.ts" }, // wait, user has its own controller?
    "Companies/company.service.ts": { api: "Company", file: "company.helper.ts" },
    "CompanyServices/company-service.service.ts": { api: "CompanyService", file: "company-service.helper.ts" },
    "Providers/provider.service.ts": { api: "Provider", file: "provider.helper.ts" },
    "Webhook/webhook.service.ts": { api: "Webhook", file: "webhook.helper.ts" },
    "transactions/transaction.service.ts": { api: "transactions", file: "transactions.helper.ts" }
};

const project = new Project();

// Let's just do file moving first, we will handle imports later.
for (const [oldPath, info] of Object.entries(servicesMap)) {
    const fullOldPath = path.join(servicesDir, oldPath);
    if (fs.existsSync(fullOldPath)) {
        const destDir = path.join(controllersDir, info.api);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        const fullNewPath = path.join(destDir, info.file);
        fs.renameSync(fullOldPath, fullNewPath);
    }
}

// Now handle routes and controllers
for (const [api, routeName] of Object.entries(apiMap)) {
    const routeFilePath = path.join(routesDir, api, "route.ts");
    if (!fs.existsSync(routeFilePath)) continue;
    
    const sourceFile = project.addSourceFileAtPath(routeFilePath);
    
    const destDir = path.join(controllersDir, api);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    
    const controllerFilePath = path.join(destDir, `${routeName}.controller.ts`);
    const newRouteFilePath = path.join(routesDir, `${routeName}.route.ts`);
    
    const controllerFile = project.createSourceFile(controllerFilePath, "", { overwrite: true });
    const newRouteFile = project.createSourceFile(newRouteFilePath, "", { overwrite: true });
    
    // Copy imports that are necessary. For simplicity, copy all imports to both and clean up later.
    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
        controllerFile.addImportDeclaration(imp.getStructure());
        newRouteFile.addImportDeclaration(imp.getStructure());
    }
    
    // We also need to add import of controller to the new route file
    newRouteFile.addImportDeclaration({
        moduleSpecifier: `../controllers/${api}/${routeName}.controller`,
        namedImports: [] // we will populate this
    });
    
    newRouteFile.addImportDeclaration({
        moduleSpecifier: "express",
        namedImports: [{ name: "Router" }]
    });
    
    newRouteFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [{ name: "router", initializer: "Router()" }]
    });
    
    const controllerNames: string[] = [];
    
    // Extract route handlers
    const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    let handlerIndex = 1;
    for (const callExpr of callExprs) {
        const expr = callExpr.getExpression();
        if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
            const propAccess = expr.asKind(SyntaxKind.PropertyAccessExpression);
            if (propAccess?.getExpression().getText() === "router") {
                const method = propAccess.getName();
                if (["get", "post", "put", "delete", "patch"].includes(method)) {
                    const args = callExpr.getArguments();
                    if (args.length >= 2) {
                        const routePath = args[0].getText().replace(/['"]/g, "");
                        // The last argument is the handler
                        const handler = args[args.length - 1];
                        const middlewares = args.slice(1, -1);
                        
                        // Create a unique controller name
                        const controllerName = `${method}${routePath.replace(/[^a-zA-Z0-9]/g, "_")}_handler${handlerIndex++}`;
                        controllerNames.push(controllerName);
                        
                        // Add handler to controller file
                        controllerFile.addVariableStatement({
                            isExported: true,
                            declarationKind: VariableDeclarationKind.Const,
                            declarations: [{
                                name: controllerName,
                                initializer: handler.getText()
                            }]
                        });
                        
                        // Add route to new route file
                        const mwTexts = middlewares.map(m => m.getText());
                        const argsText = [`'${routePath}'`, ...mwTexts, controllerName].join(", ");
                        newRouteFile.addStatements(`router.${method}(${argsText});`);
                    }
                }
            }
        }
    }
    
    // Update the named imports from controller
    const ctrlImport = newRouteFile.getImportDeclarations().find(i => i.getModuleSpecifierValue() === `../controllers/${api}/${routeName}.controller`);
    if (ctrlImport) {
        ctrlImport.addNamedImports(controllerNames);
    }
    
    // Add default export to new route file
    newRouteFile.addExportAssignment({
        isExportEquals: false,
        expression: "router"
    });
    
    controllerFile.saveSync();
    newRouteFile.saveSync();
}

console.log("Refactoring done. Needs manual cleanup for imports and unused codes.");
