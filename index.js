const axios = require("axios");
const express = require("express");
const app = express();
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");
const NepaliDateTime = require("nepali-datetime");
require("dotenv").config();
const PORT = process.env.PORT || 3000;

// News scraping function
async function fetchNewsFromPage(pageNumber) {
  let config = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://myrepublica.nagariknetwork.com/latest-news?page=${pageNumber}`,
    headers: {
      Cookie:
        "XSRF-TOKEN=eyJpdiI6Ilk4aGIwajQ4RTQvaHU0dmh0a0VjT3c9PSIsInZhbHVlIjoiTHQ5MmVDRFA1M1RCREpPMUdrdk9TeWVnN3Rud1QyZkJpbUxaWW5CUDYwR0JNMTAzR3lJd2crUlFGKytBRXZNSENKSFNKeXRmbWRiVllSYlo4WGtyNStuejJNSVhZZHZ4YXJaeXRSR0JnYmVUcXptUXFrd1hRN2FRYzlqMUlLSm0iLCJtYWMiOiJlZWU3NjNkM2VjNmJjNGY3OTZkYjk0MmVhNWUwY2Y5NzYyNDg0MTZiODhkZTk0YWVkNjZhYmExNjZhMGYxM2Y1IiwidGFnIjoiIn0%3D; republica_session=eyJpdiI6IlQvc3BnSnlCRC9FdjFjM0NEdjExeGc9PSIsInZhbHVlIjoiak5WZFNUckcyeWQ2cG9pL09JTUZqcytqcXBLcjBpeE5IQ3dqK3hrWitxQW55NEpHYitxa0xuU3dVcFM4dW9XQ3htdDduTExJZkhXTjlJSzZ6M3l5a1Fxa3AzRERIRStsZE9tcFE5eGhvRStNazZ5aVA5QVUyR01sZDNMNHNvSlciLCJtYWMiOiJhMjM1NjE2MjBhMWI5NjM5NDVhYjRjNDQ3ZDM4YmQ4NTE2NjE3NzI3ZDYyNjRhMTRmNGQ5N2I4ZjdjNWI5ODQyIiwidGFnIjoiIn0%3D",
    },
  };

  try {
    const response = await axios.request(config);
    const html = response.data;
    const $ = cheerio.load(html);

    const newsItems = [];

    // Get all titles
    const titles = [];
    $(".mb-2.rep-title--large.lg\\:block.hidden").each((i, el) => {
      titles.push({
        index: i,
        element: el,
        text: $(el).text().trim(),
      });
    });

    // Get all times
    const times = [];
    $(
      ".rep-body--x-small.font-medium.text-neutral-light-gray.block.min-w-\\[140px\\].lg\\:block.hidden"
    ).each((i, el) => {
      times.push({
        index: i,
        text: $(el).text().trim(),
      });
    });

    // Match titles with times assuming they have the same index
    for (let i = 0; i < titles.length; i++) {
      const title = titles[i].text;
      const publishedTime = i < times.length ? times[i].text : "Time not found";

      // Find link by looking at parent or ancestor elements of the title
      const titleEl = $(titles[i].element);
      const linkEl = titleEl.closest("a") || titleEl.parent().closest("a");
      const link = linkEl.length ? linkEl.attr("href") : null;

      newsItems.push({
        title: title,
        publishedTime: publishedTime,
        link: link
          ? link.startsWith("http")
            ? link
            : `https://myrepublica.nagariknetwork.com${link}`
          : null,
        page: pageNumber,
      });
    }

    return newsItems;
  } catch (error) {
    console.error(`Error fetching page ${pageNumber}:`, error.message);
    return [];
  }
}

async function scrapeMultiplePages(startPage, endPage) {
  let allNews = [];

  console.log(`Fetching news from pages ${startPage} to ${endPage}...`);

  // Process pages sequentially
  for (let page = startPage; page <= endPage; page++) {
    const pageNews = await fetchNewsFromPage(page);
    allNews = allNews.concat(pageNews);
  }

  return allNews;
}

// Function to send news via email
async function sendNewsViaEmail(newsItems) {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD, // Use App Password, not your regular password
    },
  });

  const formatNewsAsHTML = (newsItems) => {

    const nepaliDate = new NepaliDateTime();
    const gregorianDate = new Date();

    let html = `
      <h1 style="font-family: Arial, sans-serif; color: #333;">Latest News from MyRepublica</h1>
      <p style="font-family: Arial, sans-serif; color: #666;">
        Scraped on: ${gregorianDate.toLocaleString()} 
        (Nepali Date: ${nepaliDate.format('YYYY MMMM DD, dddd')})
      </p>
      <hr style="border: 1px solid #ddd;">
      <div style="font-family: Arial, sans-serif;">
    `;

    newsItems.forEach((item, index) => {
      html += `
        <div style="margin-bottom: 20px; padding: 10px; background-color: ${
          index % 2 === 0 ? "#f9f9f9" : "#ffffff"
        }; border-radius: 5px;">
          <h2 style="color: #333; margin: 0 0 5px 0; font-size: 1.2em;">${item.title}</h2>
          <p style="color: #666; margin: 0; font-size: 0.8em;">${item.publishedTime}</p>
          ${
            item.link
              ? `<a href="${item.link}" style="color: #0066cc; text-decoration: none;">Read more</a>`
              : ""
          }
        </div>
      `;
    });

    html += `
      </div>
      <hr style="border: 1px solid #ddd;">
      <p style="font-family: Arial, sans-serif; font-size: 0.8em; color: #666;">
        This email was generated automatically by a news scraper.
      </p>
    `;

    return html;
};

  
  let mailOptions = {
    from: process.env.EMAIL,
    to:[process.env.EMAIL,process.env.ANOTHERGMAIL],
    subject: `MyRepublica News Update - ${new Date().toLocaleDateString()}`,
    html: formatNewsAsHTML(newsItems),
  };

 
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}


// News scraping settings
const START_PAGE = 1;
const END_PAGE = 4;

// Function to run the news scraper job
async function runNewsScraperJob() {

  try {
    // Scrape news
    const allNews = await scrapeMultiplePages(START_PAGE, END_PAGE);

    console.log(`Successfully scraped ${allNews.length} news items.`);

    // Send news via email
    if (allNews.length > 0) {
      await sendNewsViaEmail(allNews);
    } else {
      console.log("No news items found to send.");
    }
  } catch (error) {
    console.error("An error occurred during the scheduled job:", error);
  }
}

app.get("/", (req, res) => {
  res.send("News scraper service is running!");
});


app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});


app.get("/run-scraper", async (req, res) => {
  try {
    await runNewsScraperJob();
    res
      .status(200)
      .json({ status: "success", message: "News scraper job completed" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
