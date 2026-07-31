import os
import re

src_dir = "/home/abhiram-a-r/Documents/projects/payment-sdk/backend/server/src"
routes_dir = os.path.join(src_dir, "routes")
controllers_dir = os.path.join(src_dir, "controllers")

# Fix routes
for root, _, files in os.walk(routes_dir):
    for file in files:
        if file.endswith('.route.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # fix depth
            content = content.replace("'../../middlewares/", "'../middlewares/")
            content = content.replace("'../../../utils/", "'../../utils/")
            content = content.replace("'../../../db", "'../../db")
            content = content.replace("'../../services/", "'../controllers/")
            
            # fix service to helper extension (e.g. auth.service -> auth.helper)
            content = content.replace(".service'", ".helper'")
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)

# Fix controllers
for root, dirs, files in os.walk(controllers_dir):
    for file in files:
        path = os.path.join(root, file)
        
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()

        if file.endswith('.controller.ts'):
            # Add explicit types to exported handlers
            # export const handler = async (req, res, next) =>
            
            # First, ensure Request, Response, NextFunction are imported from express
            if "import { Request, Response, NextFunction" not in content and "import { Request" not in content:
                content = "import { Request, Response, NextFunction } from 'express';\n" + content
            
            # regex to find the handler parameters
            # we can look for `export const \w+ = async \((.*?)\) => {`
            def replacer(match):
                params = match.group(1)
                # if params is already typed, skip
                if ":" in params:
                    return match.group(0)
                
                parts = [p.strip() for p in params.split(',') if p.strip()]
                new_parts = []
                for i, p in enumerate(parts):
                    if p == 'req' or p == 'req: any':
                        new_parts.append('req: Request | any')
                    elif p == 'res':
                        new_parts.append('res: Response')
                    elif p == 'next':
                        new_parts.append('next: NextFunction')
                    else:
                        new_parts.append(f"{p}: any")
                
                new_params = ", ".join(new_parts)
                return f"export const {match.group(0).split('=')[0].split(' ')[2]} = async ({new_params}) => {{"
            
            # A bit tricky: the regex should just match the function start
            content = re.sub(r'export const (\w+) = async \((.*?)\) => \{',
                             lambda m: f"export const {m.group(1)} = async ({', '.join([p if ':' in p else p + ': any' for p in m.group(2).split(',')]) if m.group(2) else ''}) => {{",
                             content)

        elif file.endswith('.helper.ts'):
            # The depth of helper is the same as the old service, so imports are fine, 
            # but wait, it was in `src/services/Auth/auth.service.ts` -> `src/controllers/Auth/auth.helper.ts`
            # The depth is exactly the same, so `../../middlewares` remains valid.
            pass

        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
