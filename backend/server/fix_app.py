import os

app_path = "/home/abhiram-a-r/Documents/projects/payment-sdk/backend/server/src/app.ts"
with open(app_path, "r") as f:
    content = f.read()

content = content.replace("'./routes/Auth/route'", "'./routes/auth.route'")
content = content.replace("'./routes/User/route'", "'./routes/user.route'")
content = content.replace("'./routes/Company/route'", "'./routes/company.route'")
content = content.replace("'./routes/CompanyService/route'", "'./routes/company-service.route'")
content = content.replace("'./routes/Provider/route'", "'./routes/provider.route'")
content = content.replace("'./routes/transactions/route'", "'./routes/transactions.route'")
content = content.replace("'./routes/Webhook/route'", "'./routes/webhook.route'")

with open(app_path, "w") as f:
    f.write(content)
