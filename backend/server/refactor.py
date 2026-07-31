import os
import re
import shutil

src_dir = "/home/abhiram-a-r/Documents/projects/payment-sdk/backend/server/src"
routes_dir = os.path.join(src_dir, "routes")
services_dir = os.path.join(src_dir, "services")
controllers_dir = os.path.join(src_dir, "controllers")

if not os.path.exists(controllers_dir):
    os.makedirs(controllers_dir)

api_map = {
    "Auth": "auth",
    "Company": "company",
    "CompanyService": "company-service",
    "Provider": "provider",
    "User": "user",
    "Webhook": "webhook",
    "transactions": "transactions"
}

services_map = {
    "Auth/auth.service.ts": ("Auth", "auth.helper.ts"),
    "Auth/user.service.ts": ("User", "user.helper.ts"),
    "Companies/company.service.ts": ("Company", "company.helper.ts"),
    "CompanyServices/company-service.service.ts": ("CompanyService", "company-service.helper.ts"),
    "Providers/provider.service.ts": ("Provider", "provider.helper.ts"),
    "Webhook/webhook.service.ts": ("Webhook", "webhook.helper.ts"),
    "transactions/transaction.service.ts": ("transactions", "transactions.helper.ts")
}

for old_path, (api, new_file) in services_map.items():
    full_old = os.path.join(services_dir, old_path)
    if os.path.exists(full_old):
        dest_dir = os.path.join(controllers_dir, api)
        os.makedirs(dest_dir, exist_ok=True)
        full_new = os.path.join(dest_dir, new_file)
        shutil.move(full_old, full_new)

# For routes and controllers
def process_route_file(api, file_path, route_name):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find router.(method)('/path', ...) 
    # This regex is a bit complex for all express variations, but we'll try to grab everything
    # Let's just create controllers manually by prompting the user since automatic regex might break code.
    pass

# Alternatively, just move the whole route file to controllers, and rename it to controller.ts
# and we can leave route generation to the user or do it manually.

for api, route_name in api_map.items():
    route_dir = os.path.join(routes_dir, api)
    route_file = os.path.join(route_dir, "route.ts")
    if os.path.exists(route_file):
        dest_dir = os.path.join(controllers_dir, api)
        os.makedirs(dest_dir, exist_ok=True)
        controller_file = os.path.join(dest_dir, f"{route_name}.controller.ts")
        # For now, just move route.ts to controller.ts, and I will fix it via tools.
        shutil.move(route_file, controller_file)
        
        # We need to leave a placeholder route.ts
        with open(os.path.join(routes_dir, f"{route_name}.route.ts"), "w") as f:
            f.write("import { Router } from 'express';\n")
            f.write(f"import * as controller from '../controllers/{api}/{route_name}.controller';\n\n")
            f.write("const router = Router();\n\n")
            f.write("// TODO: Add routes here pointing to controller\n\n")
            f.write("export default router;\n")

# clean up empty dirs
for root, dirs, files in os.walk(routes_dir, topdown=False):
    for name in dirs:
        try:
            os.rmdir(os.path.join(root, name))
        except:
            pass
