# What is this?

You are not a real programmer if you don't do a crawler/scraper for your favorite website at least once in your life. This is my second time with [Filmaffinity](http://www.filmaffinity.com).

I wrote a scraper for it some years ago in PHP, and it kind of worked, but I wanted to try the power of [Node.js](https://nodejs.org).

This crawler takes advantage of the asynchronous paradigm and it sends simultaneous requests in parallel, so it reduces in some orders of magnitude the time to crawl the whole web.

# What do you need

Filmaffinity.com will block your IP if you do too many request so, if you want to get all their film information (more than 130 000 at this moment), some workaround is needed.

First I was thinking about using some different public proxies, but I didn't want to take care of them (if they are up or not, etc), so I'm taking advantage of [Tor](https://www.torproject.org/) and [Polipo](https://github.com/jech/polipo).

You will need to have them installed and running, either as a service or standalone.

If you want to store the data scraped you will also need to connect to a mysql server.

Finally, to run this piece of code you have to use [Node.js](https://nodejs.org).

# Steps to run

1. Create a new database:
    ```
    CREATE DATABASE filmaffinity;
    ```

2) Add a new user for that database and grant permissions:
    ```
    CREATE USER 'filmaffinity'@'localhost' IDENTIFIED BY 'filmaffinity';

    GRANT ALL PRIVILEGES ON filmaffinity.* TO 'filmaffinity'@'localhost';
    ```

3) Import database structure:
    ```
    mysql -ufilmaffinity -pfilmaffinity filmaffinity < sql/db_structure.sql
    ```

4) Install node modules:
    ```
    npm install
    ```

5) Run Tor and Polipo (or be sure that they are running as services).

6) Double check that the database name, user and password you added in the previous steps match the ones in config/parameters.ini

7) Run it!
    ```
    node crawl.js
    ```

    It will start crawling films that start with numbers (two pages at a time), then letter A. When 'A' is completed it will continue with 'B'. Then 'C'... I'm sure you get the pattern ;) All data will be populated to the database and the poster images will be downloaded to the "img" folder.

    You can take a look at crawler.log to see what is happening behind the scenes.
