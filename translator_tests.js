const playwright = require('playwright');
const assert = require('assert');

(async () => {
    for (const browserType of ['chromium', 'firefox', 'webkit']){
        console.log("TESTS FOR BROWSER: " + browserType);
    const browser = await playwright[browserType].launch({
        ignoreDefaultArgs: ['--disable-extensions'],
        headless: false,
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("https://translate.google.com/");

    const delete_btn = await page.$('.clear > div:nth-child(1)');

    function screen(name) {
        var datetime = new Date().toLocaleString().replace(/[,/\ :]/g, '-')
        page.screenshot({ path: 'output/'+ browserType + '-' + name + '-' + datetime + '.png' })
    }

    // TEST DATA:
    const text = ['Slovenčina je krásna.', 'Slovak is beautiful.', 'Slovenština je krásná.'];
    const jazyk = ['SLOVAK', 'ENGLISH', 'CZECH'];



    console.log("\nLANGUAGE DETECTION TEST");

    for (i = 0; i < text.length; i++) {

        await page.type('[id=source]', text[i]);
        await page.waitForTimeout(2000);

        const language_detected = await page.innerText('.sl-sugg > div:nth-child(2) > div:nth-child(1)');

        try {
            assert(language_detected == (jazyk[i] + ' - DETECTED'));
            console.log("SUCCESS! Test for " + jazyk[i] + " language detection passed");
        } catch (error) {
            console.log("ERROR! Test for " + jazyk[i] + " language detection failed");
        }

        screen("detection");
        await page.waitForTimeout(2000);
        await delete_btn.click();
    }



    console.log("\nDELETE TEXT TEST");

    await page.type('[id=source]', text[1]);
    assert((await page.$eval("#source", (el) => el.value)) === text[1]);
    await delete_btn.click();

    try {
        assert((await page.$eval("#source", (el) => el.value)) === '');
        console.log("SUCCESS! Test for delete text passed");
    } catch (error) {
        console.log("ERROR! Delete text test failed");
        console.log("BUG IN DELETION");
    }

    screen("deletion");
    await page.waitForTimeout(2000);



    console.log("\nMANUAL SELECTION TEST");

    await page.type('[id=source]', text[0]);
    await page.waitForTimeout(2000);

    const language_selector = await page.$('.tl-more');
    await language_selector.click();
    const czech = await page.$('.tl_list_cs_checkmark');
    await czech.click();
    await page.waitForTimeout(2000);

    const result_element = await page.textContent('.tlid-translation');

    try {
        assert(result_element == text[2]);
        console.log("Test for manual language selection successful");
    } catch (error) {
        console.log("ERROR! Expected result was: " + text[2] + " but the result was: " + result_element);
        console.log("BUG IN TRANSLATION");
    }

    screen("selection");
    await page.waitForTimeout(2000);
    await delete_btn.click();



    console.log("\nLANGUAGE EXCHANGE TEST");

    await page.type('[id=source]', text[2]);
    await page.waitForTimeout(2000);
    const source_element1 = await page.textContent('.text-dummy');
    const result_element1 = await page.textContent('.tlid-translation');

    screen("exchange_before");
    await page.waitForTimeout(2000);

    const switch_button = await page.waitForSelector('.swap');

    await switch_button.click();
    await page.waitForTimeout(2000);

    const source_element2 = await page.textContent('.text-dummy');
    const result_element2 = await page.textContent('.tlid-translation');

    try {
        assert(source_element1 == result_element2);
        assert(source_element2 == result_element1);
        console.log("SUCCESS! Test for exchange language successful");
    } catch (error) {
        console.log("ERROR! Switching between translations does not work properly");
    }

    screen("exchange_after");
    await page.waitForTimeout(2000);



    console.log("\nDOCUMENT TRANSLATION TEST");

    const documents_button = await page.$('div.tlid-input-button:nth-child(2) > div:nth-child(1)');
    await documents_button.click();

    await language_selector.click();
    const english = await page.$('.tl_list_en_checkmark');
    await english.click();
    await page.waitForTimeout(2000);

    page.click('.tlid-select-file-button');

    page.on('filechooser', async (fileChooser) => {
        await fileChooser.setFiles('input/test_document.docx');
    });
    page.click('.tlid-translate-doc-button');
    await page.waitForTimeout(2000);
    const pagesource = await page.content();

    try {
        assert(pagesource.includes("Text to test the document translation function."));
        console.log("SUCCESS! Test for document translation passed");
    } catch (error) {
        console.log("ERROR! Test for document translation failed");
    }

    screen("document");
    await page.waitForTimeout(2000);

    await browser.close();
}
})();