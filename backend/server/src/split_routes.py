import os
import re

controllers_dir = "/home/abhiram-a-r/Documents/projects/payment-sdk/backend/server/src/controllers"
routes_dir = "/home/abhiram-a-r/Documents/projects/payment-sdk/backend/server/src/routes"

api_map = {
    "Auth": "auth",
    "Company": "company",
    "CompanyService": "company-service",
    "Provider": "provider",
    "User": "user",
    "Webhook": "webhook",
    "transactions": "transactions"
}

def parse_file(api, route_name):
    controller_file = os.path.join(controllers_dir, api, f"{route_name}.controller.ts")
    if not os.path.exists(controller_file):
        return

    with open(controller_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the router variable name
    match = re.search(r'const\s+(\w+)\s*=\s*(?:express\.)?Router\(\)', content)
    router_var = match.group(1) if match else "router"

    # We will search for occurrences of router_var.METHOD(
    pattern = re.compile(rf"{router_var}\.(get|post|put|delete|patch)\(")
    
    extracted_routes = []
    
    pos = 0
    while True:
        match = pattern.search(content, pos)
        if not match:
            break
            
        start_idx = match.start()
        # Find the matching closing parenthesis for router.METHOD(...)
        open_parens = 0
        in_string = False
        string_char = None
        escape = False
        
        end_idx = start_idx
        for i in range(start_idx, len(content)):
            char = content[i]
            if escape:
                escape = False
                continue
            if char == '\\':
                escape = True
                continue
                
            if in_string:
                if char == string_char:
                    in_string = False
                continue
                
            if char in ("'", '"', '`'):
                in_string = True
                string_char = char
                continue
                
            if char == '(':
                open_parens += 1
            elif char == ')':
                open_parens -= 1
                if open_parens == 0:
                    end_idx = i + 1
                    break
                    
        route_call = content[start_idx:end_idx]
        
        # Now we need to extract the path, middlewares, and the handler
        # A simple way to split arguments is to look at the top level commas inside route_call
        # route_call looks like: router_var.post('/path', mw1, mw2, async (req, res) => { ... })
        # Let's just grab the path, and replace the handler with a named function.
        
        # Actually, maybe I can just do this in node using typescript AST which is 1000x safer.
        pass

# I'll just write a quick node script that uses regex or string manipulation.
