const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment')
const Products = require('../../models/products')
const { process: logger } = require('../../../helper/logger')

const services = {
    scrapeOtomax: async() => {
        logger.log('info', `${moment().format()} | Scraping otomax ... `);
        try {
            let link = 'http://report.cebongpayment.com/harga.js.php?id=d10761eede822de1d35fdbbe1a96d450de2f0d46d6181da436acc6bf3b2d947381c344a167795836e34c15850ed3ba5b-84';
            logger.log('info', `${moment().format()} | Scraping otomax | Retrieving link ... `);
            const { data } = await axios.get(link);

            const $ = cheerio.load(data);

            let tableWrapper = $(".tablewrapper table");
            let upserts = [];
            let product = { 
                'code': '', 
                'name': '', 
                'price': '', 
                'description': '', 
                'status': false ,
                'supplier': 'otomax',
                'sourceLink': link,
                'category': '',
                'group': ''
            }
            
            for (let table of tableWrapper) {
                let tr = $(table).children("tbody").children("tr");
                for (let val of tr) {
                    let classVal = $(val).attr("class");
                    if (classVal === 'head') {
                        let headCategory = $(val).children(".last").attr("colspan");
                        if (headCategory) {
                            let category = $(val).children(".last").text();
    
                            product.category = category;
                        }
                    }
                    if (classVal !== 'head') {
                        let dataTd = $(val).children("td");
                        let counter = 0;
                        
                        for (let item of dataTd) {
                            let classTd = $(item).attr("class");
                            let value = ""
                            if (classTd === "center last") {
                                value = $(item).children("span").text();
                            } else {
                                value = $(item).text();
                            }
    
                            if (!value) continue;
                            
                            switch(counter) {
                                case 0:
                                    product.code = value;
                                case 1:
                                    product.description = value;
                                case 2:
                                    let splittedVal = value.split('.');
                                    value = splittedVal.join('');
                                    product.price = parseInt(value);
                                case 3:
                                    value = value === 'open' ? true : false;
                                    product.status = value;
                                default:
    
                            }
                            counter++;
                        }
                    }

                    if (product.code) {
                        let newProduct = { ...product }
                        upserts.push(Products.updateOne({ code: newProduct.code, supplier: newProduct.supplier  }, newProduct, { upsert: true }));
                    }
                }
            }

            let upsertMany = Promise.all(upserts);
            await upsertMany;

            logger.log('info', `${moment().format()} | Scraped otomax finish | success `);
            return true;
        } catch (err) {
            logger.log('error', `${moment().format()} | Scraped otomax finish | failed | ${err.message} `);
            console.error(err);
            return false;
        }
    },
    scrapeStokpulsa: async() => {
        logger.log('info', `${moment().format()} | Scraping stokpulsa ... `);
        try {
            let link = 'http://202.152.30.78:8080/h2h/all/';
            logger.log('info', `${moment().format()} | Scraping stokpulsa | Retrieving link ... `);
            const { data } = await axios.get(link);

            const $ = cheerio.load(data);

            let tables = $('table');
            let upserts = [];
            let product = { 
                'code': '', 
                'name': '',
                'price': '', 
                'status': false ,
                'description': '', 
                'supplier': 'stokpulsa', 
                'sourceLink': link,
                'category': '',
                'group': ''
            }
            
            for (let table of tables) {
                let trs = $(table).children('tbody').children('tr');

                for (let tr of trs) {
                    let hasBgcolor = $(tr).attr('bgcolor');

                    //Title
                    if (hasBgcolor && hasBgcolor === '#CAFFFF') {
                        let trValue = $(tr).children('td').children('strong').text();
                        product.category = trValue;
                        continue;
                    }

                    //column head
                    if (hasBgcolor && hasBgcolor === '#EFF0EC') continue;

                    let tds = $(tr).children('td');
                    let counter = 0;
                    for (let td of tds) {
                        let tdValue = $(td).text();

                        switch (counter) {
                            case 0:
                                product.code = tdValue;
                            case 1:
                                tdValue = tdValue === 'Normal' ? true : false;
                                product.status = tdValue;
                            case 2:
                                product.price = parseInt(tdValue);
                            default:
                        }

                        counter++;
                    }
                    let newProduct = {...product}
                    upserts.push(Products.updateOne({ code: newProduct.code, supplier: newProduct.supplier }, newProduct, { upsert: true }))
                }
            }

            let upsertMany = Promise.all(upserts);
            await upsertMany;

            logger.log('info', `${moment().format()} | Scraped stokpulsa | success `);
            return true;
        } catch (err) {
            logger.log('error', `${moment().format()} | Scraped stokpulsa | failed | ${err.message} `);
            console.error(err);
            return false;
        }
    },
    findBySupplier: async(supplier) => {
        return await Products.find({ 'supplier': supplier }).exec();
    }
}

module.exports = services;