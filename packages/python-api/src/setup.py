try:
    from setuptools import setup, find_packages
except ImportError:
    from distutils.core import setup, find_packages


setup(
    name='scrapoxy',
    packages=find_packages(),
    install_requires=[],
    version='2.0.4',
    description='Python API for Scrapoxy',
    author='Fabien Vauchelles',
    author_email='fabien@vauchelles.com',
    url='https://github.com/fabienvauchelles/scrapoxy',
    keywords=['crawler', 'crawling', 'scrapoxy', 'scrapy', 'scraper', 'scraping', 'webscraping', 'proxy'],
    classifiers=[],
)
