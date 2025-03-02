# Automate News

Automate News is a project that fetches news and sends it to specified email addresses automatically using cron jobs.

## Setup Instructions

### 1. Clone the Repository
```sh
git clone https://github.com/SaurabPrasai/automate-news-.git
cd automate-news-
```

### 2. Install Dependencies
Make sure you have Node.js installed, then run:
```sh
npm install
```

### 3. Create a `.dotenv` File
Create a `.env` file in the root directory and declare the required variables:
```env
EMAIL=your-email@gmail.com
PASSWORD=your-app-password
EMAILS=recipient1@example.com,recipient2@example.com
```
- `EMAIL`: Your Gmail address (used for sending emails)
- `PASSWORD`: Your **App Password** from Google (not your Gmail password)
- `EMAILS`: A comma-separated list of email recipients

### 4. Run the Project Locally
```sh
node index.js
```

### 5. Deploy to Render
1. Push the code to GitHub.
2. Go to [Render](https://render.com/), create a new **Web Service**, and connect your repository.
3. Set environment variables in Render's **Environment Settings** (same as the `.env` file).
4. Deploy the project.

### 6. Automate with Cron Jobs
Use cron jobs to automate according to your desired time.

Set the schedule to your desired frequency (e.g., every 24 hours) to automate news emails.

The news are scrapped from myrepublica .


