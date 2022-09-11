const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment')
const Products = require('../../models/products')
const { process: logger } = require('../../../helper/logger')
const md5 = require('md5')

//TODO GET DATA AND OTHER PRODUCTS

const services = {
    scrapeOtomax: async() => {
        logger.log('info', `${moment().format()} | Scraping otomax ... `);
        let groups = [
            {
                'name': 'pulsa',
                'operator': 'telkomsel',
                'pattern': [/^NFTS/, /^PTSEL/, /^HTP/, /^BYU/]
            },
            {
                'name': 'pulsa',
                'operator': 'indosat',
                'pattern': [/^PIN/, /^NFIN/]
            },
            {
                'name': 'pulsa',
                'operator': 'xl',
                'pattern': [/^NFXL/]
            },
            {
                'name': 'pulsa',
                'operator': 'axis',
                'pattern': [/^NFXL/]
            },
            {
                'name': 'pulsa',
                'operator': 'three',
                'pattern': [/^HTR/]
            },
            {
                'name': 'pulsa',
                'operator': 'smartfren',
                'pattern': [/^HSM/]
            },
            {
                'name': 'listrik',
                'operator': 'pln',
                'pattern': [/TKN/, /HTKF/,/HTKFR/]
            }
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
                                    product.description = `${categoryItem?.name} ${categoryItem?.operator} ${group}`;
                                    product.code = value;
                                case 1:
                                    // product.description = value;
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
                        let trValue = $(tr).children('td').children('strong').text().toLowerCase();
                        var [operator, pattern] = trValue.split(' kode ');
                        let operatorLength = operator.split(' ').length;
                        if (!pattern || operatorLength > 1) {
                            product.category = '';
                            continue;
                        };

                        if (operator === 'pln') {
                            product.category = 'listrik';
                        } else {
                            product.category = 'pulsa';
                        }
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
                    product.description = `${product.category} ${product.operator} ${product.group}`;
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
                    operator: operator.toLowerCase(),
                    status: true,
                    category: category.toLowerCase() 
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
    },
    fetchDigiflazz: async() => {
        let url = process.env.DIGI_URL + "price-list";
        let username = process.env.DIGI_USERNAME;
        let apiKey = process.env.DIGI_API_KEY;
        logger.log('debug', `Fetching digiflazz: ${url} : ${username} : ${apiKey}`)

        let body = {
            "cmd": "deposit",
            "username": username,
            "sign": md5(username + apiKey + "deposit")
        }

        try {
            let digiflazzCall = await axios.post(url, body)
            logger.log('debug', `digiflazzCall: `, digiflazzCall)

            let priceList = digiflazzCall.data.data

            let products = priceList.map(item => {
                const product = {}

                product["code"] = item.buyer_sku_code;
                product["name"] = item.product_name;
                product["price"] = item.price >= 50000 ? item.price + (item.price * 0.003) : item.price + (item.price * 0.0205);
                product["status"] = item.unlimited_stock ? true : item.stock > 0;
                product["description"] = item.desc;
                product["supplier"] = item.seller_name;
                product["sourceLink"] = "digiflazz";
                product["category"] = item.category.toLowerCase();
                product["operator"] = item.brand.toLowerCase();

                if (product.category === 'pulsa') {
                    const splitName = product.name.split(" ");
                    product["group"] = splitName[splitName.length - 1];
                }

                return product
            })

            logger.log('debug', `Map product result: `, products)

            Products.bulkWrite(products.map((product) => ({
                updateOne: {
                    filter: { code : product.code },
                    update: { $set: product },
                    upsert: true
                }
            })))
            // await Products.insertMany(products)

            logger.log('info', 'Fetch digiflazz finished')
            return true
        } catch(e) {
            logger.log('error', 'Error occured on fetchDigiflazz ' + e.message)
            return false
        }
    }
}

module.exports = services;