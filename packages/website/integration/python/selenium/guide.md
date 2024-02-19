# Selenium Integration

![Selenium](selenium.svg){width=230 nozoom}

This tutorial uses the Python web scraping framework [Selenium](https://www.seleniumhq.org/).


### Step 1: Install the library

```shell
pip install selenium selenium-wire webdriver-manager
```


### Step 2: Retrieve CA certificate and project token

![Certificate](../../certificate_sticky.png)

1. Open Scrapoxy User interface, and go to the project `Settings`;
2. Enable `Keep the same proxy with cookie injection`;
3. Click on `Download CA certificate` and save the file.
4. Remember the project token (format is `USERNAME:PASSWORD`).

::: info
It is assumed that file is saved in `/tmp/scrapoxy-ca.crt`.
:::


### Step 3: Create and run the script

Create a file name `selenium.py` with the following content:

```python
from seleniumwire import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

driver = webdriver.Chrome(
    seleniumwire_options={
        'proxy': {
            'http': f'http://USERNAME:PASSWORD@localhost:8888',
            'verify_ssl': True,
            'ca_cert': '/tmp/scrapoxy-ca.crt',
        },
    }
)

driver.get('https://fingerprint.scrapoxy.io')

print(driver.find_element(By.TAG_NAME, 'body').text)
```

Replace `USERNAME` and `PASSWORD` by the credentials you copied earlier.

::: info
All requests made in the same session will use the same proxy instance.
:::

Run the script:

```shell
python selenium.py
```
