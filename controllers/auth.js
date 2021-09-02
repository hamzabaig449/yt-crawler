let QUERY = "Making an omlette";
let MINIMUM_SUBSCRIBERS = "0";
let MAXIMUM_SUBSCRIBERS = "1000000";
let MINIMUM_VIEWS = "0";
let MAXIMUM_VIEWS = "1000000";
let EXPORT_FILE_NAME = "Youtube_Data.xlsx";

const puppeteer = require("puppeteer");
const LanguageDetect = require("languagedetect");
const languageDetect = new LanguageDetect();
const countryLookup = require("country-code-lookup");
const emailExtractor = require("node-email-extractor").default;
const extractUrls = require("extract-urls");
const dateformat = require("dateformat");
const deabbreviateNumber = require("deabbreviate-number");
const json2xls = require("json2xls");
const fs = require("fs");

// Sign In


exports.root = (req,res)=>{
    res.render("dashboard");
}

exports.signInProcess = (req,res)=>{

crawl();

let exportData = [];

console.log("You are in the youtube extractor Crawler ")

async function crawl() {
  try {
    (async () => {
      const browser = await puppeteer.launch();
      let page = await browser.newPage();
      await page.goto("https://www.channelcrawler.com", {
        waitUntil: "networkidle2",
      });
      await page.type("#queryName", QUERY);
      await page.type("#queryMinSubs", MINIMUM_SUBSCRIBERS);
      await page.type("#queryMaxSubs", MAXIMUM_SUBSCRIBERS);
      await page.type("#queryMinViews", MINIMUM_VIEWS);
      await page.type("#queryMaxViews", MAXIMUM_VIEWS);
      //Uncomment and add/subtract tags in the below line if needed
      //await page.type("#queryTags", "" + <TAGS>);

      await page.click("button.submitbutton.btn.btn-primary.btn-lg");
      await page.waitForSelector(
        "#main-content > div:nth-child(1) > div.col-xs-9.col-sm-4 > h3"
      );
      let itemCountElement = await page.$(
        "#main-content > div:nth-child(1) > div.col-xs-9.col-sm-4 > h3"
      );
      let itemCount = await page.evaluate(
        (el) => el.innerText,
        itemCountElement
      );
      itemCount = itemCount.replace(/\D/g, "");
      console.log("You got " + itemCount + " results for your query");
      await crawlResultSet(browser, page);
      
      await browser.close();
    })();
  } catch (err) {
    console.error(err);
  }
}

async function crawlResultSet(browser, page) {
  try {
    await pursueLinks(browser, page);
    while (true) {
      let disabledElement = await page.$(
        "#main-content > div:nth-child(3) > div > nav > ul > li.disabled > a"
      );
      let disabledText =
        disabledElement != null
          ? await page.evaluate((el) => el.textContent, disabledElement)
          : null;
      if (disabledText != null && disabledText == "Next") {
        console.log("End!");
        break;
      } else {
        try {
          await page.click(
            "#main-content > div:nth-child(3) > div > nav > ul > li.next > a"
          );
        } catch (error) {
          console.log("End!");
          break;
        }

        await page.waitForSelector(
          "#main-content > div:nth-child(1) > div.col-xs-9.col-sm-4 > h3"
        );
        await pursueLinks(browser, page);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function pursueLinks(browser, page) {
  try {
    let channels = await page.$$(
      "#main-content > div.row > div.channel.col-xs-12.col-sm-4.col-lg-3"
    );
    for (let channel of channels) {
      var payload = [];
      let channelData = {};

      let links = await channel.$$("a");
      var counter = 0;
      for (let link of links) {
        switch (counter) {
          case 0:
            channelData["channel_name"] = await page.evaluate(
              (a) => a.title,
              link
            );
            channelData["url"] = await page.evaluate((a) => a.href, link);
            break;
          case 1:
            channelData["description"] = await page.evaluate(
              (a) => a.title,
              link
            );
            break;
        }
        counter++;
      }
      channelData["channel_id"] = channelData["url"].substr(
        channelData["url"].lastIndexOf("/") + 1
      );

      try {
        channelData["detected_language"] =
          languageDetect.detect(
            channelData["description"] ?? "english"
          )[0][0] ?? "english";
      } catch (error) {
        channelData["detected_language"] = "english";
      }

      var descEmailIds = emailExtractor.text(channelData["description"]).emails;
      if (Array.isArray(descEmailIds) && descEmailIds.length > 0) {
        channelData["desc_email_ids"] = descEmailIds.toString();
      }
      var descUrls = extractUrls(channelData["description"]);
      if (Array.isArray(descUrls) && descUrls.length > 0) {
        channelData["desc_urls"] = descUrls.toString();
      }
      let countryFlagGIF = await channel.$("h4 > img");
      var countryCode =
        countryFlagGIF != null
          ? await page.evaluate(
              (el) => el.src.substr(el.src.lastIndexOf("/") + 1),
              countryFlagGIF
            )
          : null;
      if (countryCode != null) {
        channelData["country_code"] = countryCode
          .substr(0, countryCode.indexOf("."))
          .toUpperCase();
        channelData["country_name"] = countryLookup.byIso(
          channelData["country_code"]
        ).country;
      }
      channelData["user_photo_url"] = await channel.$eval(
        "a > img",
        (img) => img.src
      );
      channelData["category"] = await channel.$eval(
        "small > b",
        (el) => el.textContent
      );
      var channelInfo = (
        await channel.$eval("p > small", (el) => el.textContent)
      )
        .replace(/\t/g, "")
        .split(/\r?\n/);
      channelData["subscribers"] = channelInfo[1].split(" ")[0];
      channelData["videos"] = channelInfo[2].split(" ")[0];
      channelData["views"] = channelInfo[3].split(" ")[0];
      channelData["last_upload_date"] = dateformat(channelInfo[4], "isoDate");
      console.log(channelData);
      
      await exportData.push(channelData);
      
      
    }
    res.render("selectChoice");
  } catch (error) {
    console.error(error);
  }
}

}




