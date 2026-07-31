import os
import shutil
import re

src_dir = "/home/abhiram-a-r/Documents/projects/payment-sdk/backend/server/src"
routes_dir = os.path.join(src_dir, "routes")
services_dir = os.path.join(src_dir, "services")
controllers_dir = os.path.join(src_dir, "controllers")

if not os.path.exists(controllers_dir):
    os.makedirs(controllers_dir)

# Mapping of old directory to new base name
api_map = {
    "Auth": "auth",
    "Company": "company",
    "CompanyService": "company-service",
    "Provider": "provider",
    "User": "user",
    "Webhook": "webhook",
    "transactions": "transactions"
}

# we'll use string manipulation to separate controller logic. This is hard without AST.
# Alternatively, I can just write a script that moves files and creates empty templates,
# or moves services to controllers, and renames routes, but let me check if I can just use ts-morph.
