import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

const controllersDir = path.join(process.cwd(), 'controllers');
const routesDir = path.join(process.cwd(), 'routes');

const apiMap: Record<string, string> = {
    "Auth": "auth",
    "Company": "company",
    "CompanyService": "company-service",
    "Provider": "provider",
    "User": "user",
    "Webhook": "webhook",
    "transactions": "transactions"
};

for (const [api, routeName] of Object.entries(apiMap)) {
    const controllerFile = path.join(controllersDir, api, `${routeName}.controller.ts`);
    const routeFile = path.join(routesDir, `${routeName}.route.ts`);
    
    if (!fs.existsSync(controllerFile)) continue;
    
    const sourceCode = fs.readFileSync(controllerFile, 'utf-8');
    const sourceFile = ts.createSourceFile(controllerFile, sourceCode, ts.ScriptTarget.Latest, true);
    
    const imports: string[] = [];
    const otherCode: string[] = [];
    const routes: { method: string, path: string, middlewares: string[], handlerText: string, originalText: string }[] = [];
    
    // We'll collect the top-level nodes
    ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {
            imports.push(node.getFullText(sourceFile));
        } else if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
            const callExpr = node.expression;
            if (ts.isPropertyAccessExpression(callExpr.expression)) {
                const propAccess = callExpr.expression;
                const objText = propAccess.expression.getText(sourceFile);
                if (objText.includes('router') || objText.includes('Router')) {
                    const method = propAccess.name.getText(sourceFile);
                    if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                        const args = callExpr.arguments;
                        if (args.length >= 2) {
                            const pathArg = args[0].getText(sourceFile);
                            const handler = args[args.length - 1];
                            const middlewares = args.slice(1, -1).map(arg => arg.getText(sourceFile));
                            
                            routes.push({
                                method,
                                path: pathArg.replace(/['"]/g, ''),
                                middlewares,
                                handlerText: handler.getText(sourceFile),
                                originalText: node.getFullText(sourceFile)
                            });
                            return; // skip adding to otherCode
                        }
                    }
                }
            }
            otherCode.push(node.getFullText(sourceFile));
        } else {
            // Check if it's router declaration (const router = Router())
            if (ts.isVariableStatement(node)) {
                const text = node.getText(sourceFile);
                if (text.includes('Router()') || text.includes('express.Router()')) {
                    return; // skip router declaration
                }
            }
            // Skip the export default router
            if (ts.isExportAssignment(node) || node.getText(sourceFile).includes('export default')) {
                return;
            }
            otherCode.push(node.getFullText(sourceFile));
        }
    });

    let controllerContent = imports.join('') + '\n' + otherCode.join('');
    let routeContent = `import { Router } from 'express';\n`;
    
    const handlerNames: string[] = [];
    
    // Generate named exports for handlers
    routes.forEach((route, idx) => {
        const handlerName = `${route.method}${route.path.replace(/[^a-zA-Z0-9]/g, '_')}_handler${idx}`;
        handlerNames.push(handlerName);
        
        controllerContent += `\nexport const ${handlerName} = ${route.handlerText};\n`;
    });
    
    if (handlerNames.length > 0) {
        routeContent += `import { ${handlerNames.join(', ')} } from '../controllers/${api}/${routeName}.controller';\n`;
    }
    
    // Move any middleware imports to routeContent if they are used in routes
    routeContent += imports.join('');
    
    routeContent += `\nconst router = Router();\n\n`;
    
    routes.forEach((route, idx) => {
        const handlerName = handlerNames[idx];
        const mwString = route.middlewares.length > 0 ? route.middlewares.join(', ') + ', ' : '';
        routeContent += `router.${route.method}('${route.path}', ${mwString}${handlerName});\n`;
    });
    
    routeContent += `\nexport default router;\n`;
    
    fs.writeFileSync(controllerFile, controllerContent);
    fs.writeFileSync(routeFile, routeContent);
}

console.log('Refactoring complete');
