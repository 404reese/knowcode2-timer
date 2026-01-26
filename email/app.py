import smtplib
import pandas as pd
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

SENDER_EMAIL = ""
SENDER_PASSWORD = ""  

CSV_FILE = "teams.csv"
# ----------------------------------------

def send_email(to_email, team_name, login_id, password):
    subject = f"KnowCode 3.0 Internet Login Credentials – {team_name}"

    body = f"""
Hello {team_name} Team,

Welcome to the KnowCode 3.0 Hackathon 

Below are your internet login credentials for the event:

-> Login ID: {login_id}
-> Password: {password}

Please do not share these credentials with other teams.
If you face any connectivity issues, reach out to the organizing team immediately.

Best of luck and happy hacking! 
– Tech Team KN3
"""

    msg = MIMEMultipart()
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    server.sendmail(SENDER_EMAIL, to_email, msg.as_string())


df = pd.read_csv(CSV_FILE)

server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
server.starttls()
server.login(SENDER_EMAIL, SENDER_PASSWORD)

for _, row in df.iterrows():
    send_email(
        row["email"],
        row["team_name"],
        row["login_id"],
        row["password"]
    )
    print(f"Email sent to {row['team_name']} ({row['email']})")

server.quit()
print("All emails sent successfully.")
