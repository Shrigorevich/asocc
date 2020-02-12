
const cheerio = require('cheerio');

const request = require('request-promise')

const {Pool} = require('pg')

function parse(arr, arr_to_fill){
   return new Promise((resolve, reject) => {
      if(arr.length){
         Promise.all(arr.splice(0, 25).map((item, i) => {
            return new Promise((res, rej) => {
               request(`https://motherboarddb.com/${item}}`).then(html => {
                  let $ = cheerio.load(html);
                   arr_to_fill.push([$('h1').text(), $('tbody').eq(0).children().eq(2).find('td').text().replace(/\n|1x/g, ''), $('tbody').eq(0).children().eq(4).find('td').text().replace(/\n/g, ''), $('div.card-body').eq(5).find('ul').text().replace(/\n|1x/g, '').split('@')[0].trim(), $('div.card-body').eq(7).find('td').eq(0).text(), parseInt($('div.card-body').eq(7).find('td').eq(2).text().trim().replace('MHz', '').trim())]);
                  res($('h1').text())
               })
            })
         })).then(res => {
            console.log('Processing:', arr_to_fill.length, arr.length);
            resolve(parse(arr, arr_to_fill))})
      }else{
         resolve('finish')
      }
   })
}

function getMB() {
    return new Promise((resolve, reject) => {
        for(let i = 1; i <= 30; i++){
            request(`https://motherboarddb.com/motherboards/ajax/table/?dt=table&page=${i}`)
            .then(res => {
                let $ = cheerio.load(res);
                $('a', 'td.align-middle').each((i, el) => {
                    result.push($(el).attr('href'))
                })
                return result;
            }).then((res) => { if (result.length > 1475) {resolve(result)}})
        }
    })
}
getMB().then((data) => {
    const array_to_fill = [];
    parse(data, array_to_fill).then((res) => {
      console.log(res, array_to_fill.length, array_to_fill.slice(0,50));
        array_to_fill = array_to_fill.filter(elem => (elem[5]))
        .map((elem) => {
            return `('${elem[0]}', '${elem[1]}', '${elem[2]}', '${elem[3]}', '${elem[4]}', ${elem[5]})`
        })
        console.log(array_to_fill.length, array_to_fill[0]);

        const pool = new Pool({
            host: '127.0.0.1',
            port: 5432,
            database: 'modules',
            user: 'admin',
            password: '456385',
        })
        const sql =  `INSERT INTO motherboards(name, socket, chipset, bus, ram, speed) VALUES ${array_to_fill.join(', ')}`
        pool.query(sql);
        pool.end();
     })
})
/////////////////////////////

// const getData = (link) => {
//     const result = []
//     return new Promise((resolve, reject) => {
//         request(link).then(res => {
//
//             let $ = cheerio.load(res);
//             if (link.includes('CPU')){
//                 $('tbody', '#cputable').children().filter((i, el) => {
//                     return i % 2 == 0 && $(el).children().eq(9).text() != 'NA' && $(el).children().eq(2).text() != 'NA' && $(el).children().eq(10).text() == 'Desktop'
//                 }).each((i, el) => {
//                     result.push(`('${$(el).children().eq(0).text()}', ${$(el).children().eq(2).text()},'${$(el).children().eq(9).text()}', '${$(el).next().find('div').eq(0).text().replace('Clock Speed: ', '')}', '${$(el).next().find('div').eq(1).text().replace('Turbo Speed: ', '')}')`)
//                 })
//
//                 resolve(result);
//             }else{
//                 $('tbody', '#cputable').children().filter((i, el) => {
//                     return i % 2 == 0 && $(el).next().find('div').eq(0).text().replace('Bus Interface: ', '') != 'NA' && $(el).children().eq(8).text() == 'Desktop'
//                 }).each((i, el) => {
//                     result.push(`('${$(el).children().eq(0).text()}', ${$(el).children().eq(2).text()},'${$(el).next().find('div').eq(0).text().replace('Bus Interface: ', '')}', '${$(el).next().find('div').eq(1).text().replace('Max Memory: ', '')}')`)
//                 })
//                 resolve(result);
//             }
//         })
//     })
// }
// getData('https://www.videocardbenchmark.net/GPU_mega_page.html').then((data) => {
//     console.log(data[0]);
//     const pool = new Pool({
//         host: '127.0.0.1',
//         port: 5432,
//         database: 'modules',
//         user: 'admin',
//         password: '456385',
//     })
//     const sql = `INSERT INTO videocards(name, mark, bus, memory) VALUES ${data.join(', ')}`
//     pool.query(sql);
//     pool.end();
// })
//
// getData('https://www.cpubenchmark.net/CPU_mega_page.html').then((data) => {
//     console.log(data[0]);
//     const pool = new Pool({
//         host: '127.0.0.1',
//         port: 5432,
//         database: 'modules',
//         user: 'admin',
//         password: '456385',
//     })
//     const sql = `INSERT INTO processors(name, mark, socket, speed, turbo) VALUES ${data.join(', ')}`
//     pool.query(sql);
//     pool.end();
// })
