const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment')
const Products = require('../../models/products')
const { process: logger } = require('../../../helper/logger')

//TODO GET DATA AND OTHER PRODUCTS

const services = {
    scrapeOtomax: async() => {
        logger.log('info', `${moment().format()} | Scraping otomax ... `);
        let groups = [
            {
                'name': 'pulsa',
                'operator': 'telkomsel',
                'pattern': [/NFTS/, /PTSEL/, /HTP/, /BYU/]
            },
            {
                'name': 'pulsa',
                'operator': 'indosat',
                'pattern': [/PIN/, /NFIN/]
            },
            {
                'name': 'pulsa',
                'operator': 'xl',
                'pattern': [/NFXL/]
            },
            {
                'name': 'pulsa',
                'operator': 'axis',
                'pattern': [/NFXL/]
            },
            {
                'name': 'pulsa',
                'operator': 'three',
                'pattern': [/HTR/]
            },
            {
                'name': 'pulsa',
                'operator': 'smartfren',
                'pattern': [/HSM/]
            },
        ]

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
                'operator': '',
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
                                    let categoryItem = groups.find((item) => {
                                        let exist = item.pattern.find((match) => {
                                            return match.test(value);
                                        })
                                        
                                        if (exist) return true;
                                        return false;
                                    })
                                    
                                    if (categoryItem) {
                                        var [group] = value.match(/[0-9]\d*/)
                                    }

                                    product.category = categoryItem?.name || '';
                                    product.operator = categoryItem?.operator || '';
                                    product.group = group || '';
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

                    if (product.code && product.operator) {
                        let newProduct = { ...product }
                        upserts.push(Products.updateOne({ code: newProduct.code, supplier: newProduct.supplier, operator: newProduct.operator  }, newProduct, { upsert: true }));
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
                'operator': '',
                'group': ''
            }
            
            for (let table of tables) {
                let trs = $(table).children('tbody').children('tr');

                for (let tr of trs) {
                    let hasBgcolor = $(tr).attr('bgcolor');

                    //Title
                    if (hasBgcolor && hasBgcolor === '#CAFFFF') {
                        let trValue = $(tr).children('td').children('strong').text();
                        var [operator, pattern] = trValue.split(' Kode ');
                        let operatorLength = operator.split(' ').length;
                        if (!pattern || operator === 'PLN' || operatorLength > 1) {
                            product.category = '';
                            continue;
                        };
                        product.category = trValue;
                        continue;
                    }

                    //column head
                    if ((hasBgcolor && hasBgcolor === '#EFF0EC') || !product?.category) continue;

                    let tds = $(tr).children('td');
                    let counter = 0;
                    for (let td of tds) {
                        let tdValue = $(td).text();

                        switch (counter) {
                            case 0:
                                let [group] = tdValue.match(/[0-9]\d*/);
                                product.group = group;
                                product.code = tdValue;
                                product.category = 'pulsa';
                                product.operator = operator.toLowerCase();
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
                    upserts.push(Products.updateOne({ code: newProduct.code, supplier: newProduct.supplier, operator: newProduct.operator }, newProduct, { upsert: true }))
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
    findByCategoryAndOperator: async(category, operator) => {
        return await Products.aggregate([
            { 
                $match: 
                {
                    operator: operator,
                    status: true,
                    category: category
                }
            },
            {
                $group:
                {
                    _id: "$group", 
                    cheapest: { 
                        $min: {
                          "price": "$price",
                          "code": "$code",
                          "supplier": "$supplier",
                          "description": "$description",
                          "group": "$group",
                          "id": "$_id"
                        }
                    }
                }
            },
            {
                $replaceRoot:
                {
                    newRoot: "$cheapest"
                }
            },
            {
                $sort:
                {
                    price: 1
                }
            }
        ])
    }
}

module.exports = services;