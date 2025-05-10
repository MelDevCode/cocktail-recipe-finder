import express from "express";
import axios from "axios";

const app = express();
const port = 3000;
const URL_link = "https://www.thecocktaildb.com/api/json/v1/1/";

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

function getDropDownItems(list) {
    const dropDownItems = [];
    if (list.data.drinks[0].strCategory) {
        for (let i = 0; i < list.data.drinks.length; i++) {
            const item = list.data.drinks[i].strCategory;
            dropDownItems.push(item);
        }
    } else if (list.data.drinks[0].strIngredient1) {
        for (let i = 0; i < list.data.drinks.length; i++) {
            const item = list.data.drinks[i].strIngredient1;
            dropDownItems.push(item);
        }
    } else if (list.data.drinks[0].strAlcoholic) {
        for (let i = 0; i < list.data.drinks.length; i++) {
            const item = list.data.drinks[i].strAlcoholic;
            dropDownItems.push(item);
        }
    }
    return dropDownItems;
}

function getUrls(drink) {
    
    const urls = [];
    for (let i = 0; i < drink.length; i++) {
        const id = drink[i].idDrink;
        const url = `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`;
        urls.push(url);
    }
    //console.log(`These are the urls generated in the getUrls function${urls}`);
    return urls;
};

function getDrinkInfo(drink) {
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

async function fetchAllDrinks(urls) {
    const results = [];
    for (const url of urls) {
        try {
            const response = await axios.get(url);
            results.push(response);
            //await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between requests
        } catch (error) {
            console.error('Request failed for', url, error.message);
        }
    }
    return results;
}

function getCocktailList(responses) {
    //console.log(`The responses from all the call in fetch: ${responses}`);
    const cocktails = []
    for(let i = 0; i< 12; i++) {
        cocktails.push(responses[i].data.drinks)
    }
    const cocktailList = cocktails.flat().map(getDrinkInfo);
    //console.log(`The cocktailList already formatted: ${cocktailList}`);
    return cocktailList;
}

function handleError(error, res) {
    // Log the error for debugging
    console.error("Error:", error.message);
    console.error(error.stack);  // Log the stack trace for more context

    // If in production, you might want to log it to an external service like Sentry or LogRocket.

    // Display a generic error page or redirect
    if (process.env.NODE_ENV === 'production') {
        // In production, we don't want to show stack traces to users
        //res.status(500).render('error', { message: "Something went wrong. Please try again later." });
        res.status(500).send("An error occurred.");
    } else {
        // In development, you can show the stack trace for debugging
        //res.status(500).render('error', { message: error.message, stack: error.stack });
        res.status(500).send("An error occurred.");
    }
}

app.get("/", async (req, res) => {
    const result = await axios.get(URL_link + "random.php");
    
    const randomDrink = getDrinkInfo(result.data.drinks[0]);

    const alcoholResponse = await axios.get(URL_link + "list.php?a=list");
    const categoryResponse = await axios.get(URL_link + "list.php?c=list");
    const ingredientResponse = await axios.get(URL_link + "list.php?i=list");
    
    const alcoholList = getDropDownItems(alcoholResponse);
    const categoryList = getDropDownItems(categoryResponse);
    const ingredientList = getDropDownItems(ingredientResponse);
    
    res.render("index", { data: randomDrink, category: categoryList, type: alcoholList, ingredient: ingredientList, drinks: null});
});

app.post("/recipe", async (req, res) => {
    
    if (req.body.dname) {
        const resultByName = await axios.get(URL_link + "search.php?s=" + req.body.dname);
        const cocktailByName = resultByName.data.drinks.map(getDrinkInfo);

        res.render("search", { drinks: cocktailByName});
    } else {
        try {
            let result;
            if (req.body.category && req.body.category !== "Category") {
                let category = "";
                if ( req.body.category === "Punch / Party Drink" || req.body.category === "Other / Unknown" || req.body.category === "Coffee / Tea") {
                    category = encodeURIComponent(req.body.category);
                } else {
                    category = req.body.category.split(" ").join("_");
                }
                console.log(`This is the category already formatted ${category}`);
                result = await axios.get(URL_link + "filter.php?c=" + category);
            } else if (req.body.ingredient && req.body.ingredient !== "Ingredient") { 
                const category = req.body.ingredient.split(" ").join("_");
                console.log(`This is the ingredient already formatted ${category}`);
                result = await axios.get(URL_link + "filter.php?i=" + category);
            } else if (req.body.type && req.body.type !== "Type") { 
                const category = req.body.type.split(" ").join("_");
                console.log(`This is the type already formatted ${category}`);
                result = await axios.get(URL_link + "filter.php?a=" + category);
            }

            console.log(result);

            const urls = getUrls(result.data.drinks);
            const responses = await fetchAllDrinks(urls);
            const cocktailList = getCocktailList(responses);
            
            res.render("search", {drinks: cocktailList});
        } catch (error) {
            handleError(error, res);
        }
    }
});

app.post("/", (req, res) => {
    res.redirect("/");
})

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

// app.get("/", async (req, res) => {
//     const result = await axios.get(URL_link + "random.php");
    
//     const randomDrink = getDrinkInfo(result.data.drinks[0]);

//     const alcoholList = await axios.get(URL_link + "list.php?a=list");
//     const aList = alcoholList.data.drinks;
//     const alcoholicArray = [];
    
//     for (let i = 0; i < aList.length; i++) {
//         const item = aList[i].strAlcoholic;
//         alcoholicArray.push(item);
//     }

//     const categoryList = await axios.get(URL_link + "list.php?c=list");
//     const cList = categoryList.data.drinks;
//     const categoryArray = [];
    
//     for (let i = 0; i < cList.length; i++) {
//         const item = cList[i].strCategory;
//         categoryArray.push(item);
//     }

//     const ingredientList = await axios.get(URL_link + "list.php?i=list");
//     const iList = ingredientList.data.drinks;
//     const ingredientArray = [];
    
//     for (let i = 0; i < iList.length; i++) {
//         const item = iList[i].strIngredient1;
//         ingredientArray.push(item);
//     }

//     res.render("index", { data: randomDrink, category: categoryArray, type: alcoholicArray, ingredient: ingredientArray, drinks: null});
// });

// app.post("/recipe", async (req, res) => {
//     const cocktails = []
//     if (req.body.dname) {
//         const cocktailName = req.body.dname;
//         const resultByName = await axios.get(URL_link + "search.php?s=" + cocktailName);
//         const cocktailByName = resultByName.data.drinks.map(getDrinkInfo);

//         res.render("search", { drinks: cocktailByName});
//     } else if (req.body.category) {
//         const cocktailCategory = req.body.category;
//         const resultByCategory = await axios.get(URL_link + "filter.php?c=" + cocktailCategory);
        
//         const urls = getUrls(resultByCategory.data.drinks);
//         const responses = await fetchAllDrinks(urls);

//         for(let i = 0; i< 12; i++) {
//             cocktails.push(responses[i].data.drinks)
//         }
        
//         const cocktailByCategory = cocktails.flat().map(getDrinkInfo);
//         res.render("search", {drinks: cocktailByCategory})

//     } else if (req.body.ingredient) {
//         const cocktailIngredient = req.body.ingredient;
//         const resultByIngredient = await axios.get(URL_Link + "filter.php?i=" + cocktailIngredient);
        
//         const urls = getUrls(resultByIngredient.data.drinks);
//         const responses = await fetchAllDrinks(urls);
        
//         for (let i = 0; i < 12; i++) {
//             cocktails.push(responses[i].data.drinks)
//         }
//         const cocktailByIngredient = cocktails.flat().map(getDrinkInfo);
//         res.render("search", {drinks: cocktailByIngredient});

//     } else if (req.body.type) {
//         const cocktailType = req.body.type;
//         const resultByType = await axios.get(URL_link + "filter.php?a=" + cocktailType);

//         const urls = getUrls(resultByType.data.drinks);
//         const responses = await fetchAllDrinks(urls);
//         for (let i = 0; i < 12; i++) {
//             cocktails.push(responses[i].data.drinks)
//         }
//         const cocktailByType = cocktails.flat().map(getDrinkInfo);
//         res.render("search", {drinks: cocktailByType});

//     }
    
// });