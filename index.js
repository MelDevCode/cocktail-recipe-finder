import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const URL_link = "https://www.thecocktaildb.com/api/json/v1/1/";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

function transformIdstoUrls(drink) {
    const urls = [];
    for (let i = 0; i < drink.length; i++) {
        const id = drink[i].idDrink;
        const url = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`;
        urls.push(url);
    }
    return urls;
};

function transformDrink(drink) {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const measure = drink[`strMeasure${i}`];
        const ingredient = drink[`strIngredient${i}`];
        if (ingredient) {
            ingredients.push(`${measure || ""} ${ingredient}`.trim());
        }
    }

    return {
        id: drink.idDrink,
        name: drink.strDrink,
        category: drink.strCategory,
        type: drink.strAlcoholic,
        mainIngredient: drink.strIngredient1,
        glassType: drink.strGlass,
        preparation: drink.strInstructions,
        ingredients: ingredients,
        image: drink.strDrinkThumb,
    }
}

// async function fetchAllData(urls)
// {
//     try {
//         const promises = urls.map(url => axios.get(url));
//         const responses = await Promise.all(promises);
//         return responses;
//     } catch (error) {
//         console.error('One of the requests failed:', error)
//     }
// }

async function fetchAllData(urls) {
    const results = [];
    for (const url of urls) {
        try {
            const response = await axios.get(url);
            results.push(response);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between requests
        } catch (error) {
            console.error('Request failed for', url, error.message);
        }
    }
    return results;
}

app.get("/", async (req, res) => {
    const result = await axios.get(URL_link + "random.php");
    
    const randomDrink = transformDrink(result.data.drinks[0]);

    const alcoholicList = await axios.get(URL_link + "list.php?a=list");
    const aList = alcoholicList.data.drinks;
    const alcoholicArray = [];
    
    for (let i = 0; i < aList.length; i++) {
        const item = aList[i].strAlcoholic;
        alcoholicArray.push(item);
    }

    const categoryList = await axios.get(URL_link + "list.php?c=list");
    const cList = categoryList.data.drinks;
    const categoryArray = [];
    
    for (let i = 0; i < cList.length; i++) {
        const item = cList[i].strCategory;
        categoryArray.push(item);
    }

    const ingredientList = await axios.get(URL_link + "list.php?i=list");
    const iList = ingredientList.data.drinks;
    const ingredientArray = [];
    
    for (let i = 0; i < iList.length; i++) {
        const item = iList[i].strIngredient1;
        ingredientArray.push(item);
    }

    res.render("index", { data: randomDrink, category: categoryArray, type: alcoholicArray, ingredient: ingredientArray, drinks: null});
});

app.post("/recipe", async (req, res) => {
    //const cocktailIngredient = req.body.ingredient;
    //const cocktailType = req.body.type;
    if (req.body.dname) {
        const cocktailName = req.body.dname;
        const resultByName = await axios.get(URL_link + "search.php?s=" + cocktailName);
        const cocktailByName = resultByName.data.drinks.map(transformDrink);

        res.render("search", { drinks: cocktailByName});
    } else if (req.body.category) {
        const cocktailCategory = req.body.category;
        const resultByCategory = await axios.get(URL_link + "filter.php?c=" + cocktailCategory);
        const urls = transformIdstoUrls(resultByCategory.data.drinks);

        const responses = await fetchAllData(urls);

        const cocktails = []
        for(let i = 0; i< 12; i++) {
            cocktails.push(responses[i].data.drinks)
        }
        
        const cocktailByCategory = cocktails.flat().map(transformDrink);
        res.render("search", {drinks: cocktailByCategory})
    }
    
});

app.post("/", (req, res) => {
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

