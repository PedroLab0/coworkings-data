const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer')
const fs = require('fs');

const fecthAllDataPossiblePartnersValencia = async () => {
    let browser = null;
    const partnerData = [];
    let partnerPrice = '';
    let partnerType = '';
    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        await page.goto('https://coworkingspain.es/espacios/coworking/valencia');
        try {
            await page.evaluate(() => {
                const acceptCookiesButton = document.querySelector('.agree-button');
                if (acceptCookiesButton) {
                  acceptCookiesButton.click();
                }
              });  
        } catch (error) {
            console.log(error)
        }        

        while (true) {
            const html = await page.content();
            const $ = cheerio.load(html);
            //Buscamos y añadimos el contenido del título del espacio en el objeto `space` a su vez el objeto lo añadimos en la matriz de `partnerData`
            $('.spaces-list-title').each((index, el) => {
                const partnerName = $(el);
                const partnerTitle = partnerName.find('h2').text();
                $('.tarifas-views-row').each((index, el) => {
                    const partnerName = $(el);
                    const partnerType = partnerName.find('.tarifa-tipo').text();
                    const partnerPrice = partnerName.find('.tarifa-precio').text();

                    const space = {
                        name: partnerTitle,
                        type: partnerType,
                        price: partnerPrice,
                    } 
                    partnerData.push(space);
                })
            });
            
            //Buscamos y añadimos el tipo y el precio del espacio en el objeto `space` a su vez el objeto lo añadimos en la matriz de `partnerData`
           
            

            if (partnerData.length === 0) {
                console.log('no ha encontrado mas socios')
                // No hay más nombres de socios, por lo que se hace clic en el botón "Mostrar más"
                const nextPageButton = await page.$('.pager-next');
                if (nextPageButton) {
                        await Promise.all([
                            page.waitForNavigation(),
                            nextPageButton.click()
                        ]);
                    $('.spaces-list-title').each((index, el) => {
                        const partnerName = $(el);
                        const partnerTitle = partnerName.find('h2').text();
                        $('.tarifas-views-row').each((index, el) => {
                            const partnerName = $(el);
                            const partnerType = partnerName.find('.tarifa-tipo').text();
                            const partnerPrice = partnerName.find('.tarifa-precio').text();
                            const space = {
                                name: partnerTitle,
                                type: partnerType,
                                price: partnerPrice,
                            } 
                            partnerData.push(space);
                        })
                    });
                } else {
                    // No hay más botones "Mostrar más", por lo que se rompe el bucle
                    break;
                }
            } else {
                // Hay nombres de socios, por lo que se continúa rascando la página actual
                const nextPageButton = await page.$('.pager-next');
                console.log('hay nombres de mas')
                if (nextPageButton) {
                    await nextPageButton.click();
                    await page.waitForSelector('.spaces-list-title');
                    partnerData.length = 0;
                } else {
                    // No hay más botones "Mostrar más", por lo que se rompe el bucle
                    break;
                }
            }
        } 
    } catch (error) {
        console.log(error)
    }

    finally {
        if (browser !== null) {
            await browser.close();
        }
        return partnerData;
    }
}


// ...
fecthAllDataPossiblePartnersValencia().then(partnerData => {
    // Convertir los datos a una tabla HTML
    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Precio</th>
                </tr>
            </thead>
            <tbody>
                ${partnerData.map(({ name, type, price }) => `
                    <tr>
                        <td>${name}</td>
                        <td>${type}</td>
                        <td>${price}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Escribir los datos en un archivo HTML
    fs.writeFile('partners.html', tableHtml, (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log('Los datos se han guardado en partners.html');
        }
    });
});
