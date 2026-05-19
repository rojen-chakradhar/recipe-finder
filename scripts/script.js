const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

async function loadTrendingRecipes() {
  try {
    const container = document.getElementById('trendingRecipes');
    if (!container) return;

    container.innerHTML = '<p class="loading">Loading recipes...</p>';
    
    const recipes = [];
    for (let i = 0; i < 6; i++) {
      const response = await fetch(`${API_BASE}/random.php`);
      const data = await response.json();
      if (data.meals) recipes.push(data.meals[0]);
    }

    container.innerHTML = '';
    recipes.forEach(recipe => {
      container.appendChild(createRecipeCard(recipe));
    });
  } catch (error) {
    console.error('Error loading trending recipes:', error);
    const container = document.getElementById('trendingRecipes');
    if (container) container.innerHTML = '<p class="error">Failed to load recipes</p>';
  }
}

async function searchRecipe() {
  const query = document.getElementById('homeSearch')?.value.trim();
  if (!query) return alert('Please enter a recipe name');

  try {
    const response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (data.meals) {
      const recipe = data.meals[0];
      window.location.href = `recipe.html?id=${recipe.idMeal}`;
    } else {
      alert('Recipe not found');
    }
  } catch (error) {
    console.error('Error searching recipes:', error);
    alert('Search failed. Please try again.');
  }
}

async function findIngridents() {
  const ingredient = document.getElementById('ingridentInput')?.value.trim();
  if (!ingredient) return alert('Please enter an ingredient');

  try {
    const response = await fetch(`${API_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`);
    const data = await response.json();
    
    if (data.meals) {
      sessionStorage.setItem('searchResults', JSON.stringify(data.meals));
      sessionStorage.setItem('searchType', 'ingredient');
      window.location.href = 'catalog.html';
    } else {
      alert('No recipes found with that ingredient');
    }
  } catch (error) {
    console.error('Error searching ingredients:', error);
    alert('Search failed. Please try again.');
  }
}

async function loadCatalogRecipes() {
  try {
    const container = document.getElementById('catalogRecipes');
    if (!container) return;

    container.innerHTML = '<p class="loading">Loading recipes...</p>';

    const searchResults = sessionStorage.getItem('searchResults');
    if (searchResults) {
      const recipes = JSON.parse(searchResults);
      sessionStorage.removeItem('searchResults');
      sessionStorage.removeItem('searchType');
      
      container.innerHTML = '';
      recipes.forEach(recipe => {
        container.appendChild(createRecipeCard(recipe));
      });
      return;
    }

    const country = document.getElementById('countryFilter')?.value || 'all';
    let recipes = [];

    if (country === 'all') {
      const response = await fetch(`${API_BASE}/search.php?s=a`);
      const data = await response.json();
      recipes = data.meals ? data.meals.slice(0, 12) : [];
    } else {
      const response = await fetch(`${API_BASE}/filter.php?a=${encodeURIComponent(country)}`);
      const data = await response.json();
      recipes = data.meals || [];
    }

    container.innerHTML = '';
    recipes.forEach(recipe => {
      container.appendChild(createRecipeCard(recipe));
    });
  } catch (error) {
    console.error('Error loading catalog:', error);
    const container = document.getElementById('catalogRecipes');
    if (container) container.innerHTML = '<p class="error">Failed to load recipes</p>';
  }
}

async function loadRecipeDetails() {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
      window.location.href = 'catalog.html';
      return;
    }

    const container = document.getElementById('recipeContainer');
    if (!container) return;

    container.innerHTML = '<p class="loading">Loading recipe...</p>';

    const response = await fetch(`${API_BASE}/lookup.php?i=${id}`);
    const data = await response.json();

    if (!data.meals) {
      container.innerHTML = '<p class="error">Recipe not found</p>';
      return;
    }

    const meal = data.meals[0];
    container.innerHTML = createRecipeDetailHTML(meal);
  } catch (error) {
    console.error('Error loading recipe:', error);
    const container = document.getElementById('recipeContainer');
    if (container) container.innerHTML = '<p class="error">Failed to load recipe</p>';
  }
}

function createRecipeCard(recipe) {
  const card = document.createElement('div');
  card.className = 'recipe-card';
  
  const recipeId = recipe.idMeal;
  const title = recipe.strMeal;
  const image = recipe.strMealThumb;
  const category = recipe.strCategory || 'Recipe';
  
  card.innerHTML = `
    <div class="card-image">
      <img src="${image}" alt="${title}" loading="lazy">
      <span class="card-category">${category}</span>
    </div>
    <div class="card-content">
      <h3>${title}</h3>
      <a href="recipe.html?id=${recipeId}" class="card-link">View Recipe</a>
    </div>
  `;
  
  return card;
}

function createRecipeDetailHTML(meal) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push(`<li>${measure} ${ingredient}</li>`);
    }
  }

  return `
    <div class="recipe-detail">
      <div class="recipe-header">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="recipe-image">
        <div class="recipe-info">
          <h1>${meal.strMeal}</h1>
          <div class="recipe-meta">
            ${meal.strCategory ? `<span class="badge">${meal.strCategory}</span>` : ''}
            ${meal.strArea ? `<span class="badge">${meal.strArea}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="recipe-body">
        <div class="ingredients-section">
          <h2>Ingredients</h2>
          <ul class="ingredients-list">
            ${ingredients.join('')}
          </ul>
        </div>

        <div class="instructions-section">
          <h2>Instructions</h2>
          <p class="instructions">${meal.strInstructions}</p>
        </div>

        ${meal.strYoutube ? `
          <div class="video-section">
            <h2>Watch Tutorial</h2>
            <a href="${meal.strYoutube}" target="_blank" class="video-link">
              <i class="ri-play-line"></i> Watch on YouTube
            </a>
          </div>
        ` : ''}

        ${meal.strSource ? `
          <div class="source-section">
            <a href="${meal.strSource}" target="_blank" class="source-link">
              View Original Recipe
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

async function filterByCountry() {
  const country = document.getElementById('countryFilter')?.value || 'all';
  const typeFilter = document.getElementById('typeFilter')?.value || 'all';
  
  try {
    const container = document.getElementById('catalogRecipes');
    container.innerHTML = '<p class="loading">Loading recipes...</p>';

    let recipes = [];

    if (country === 'all') {
      const response = await fetch(`${API_BASE}/search.php?s=a`);
      const data = await response.json();
      recipes = data.meals ? data.meals.slice(0, 20) : [];
    } else {
      const response = await fetch(`${API_BASE}/filter.php?a=${encodeURIComponent(country)}`);
      const data = await response.json();
      recipes = data.meals || [];
    }

    container.innerHTML = '';
    recipes.forEach(recipe => {
      container.appendChild(createRecipeCard(recipe));
    });
  } catch (error) {
    console.error('Error filtering:', error);
    const container = document.getElementById('catalogRecipes');
    if (container) container.innerHTML = '<p class="error">Failed to load recipes</p>';
  }
}

async function searchCatalog(query) {
  if (!query.trim()) {
    loadCatalogRecipes();
    return;
  }

  try {
    const container = document.getElementById('catalogRecipes');
    container.innerHTML = '<p class="loading">Searching...</p>';

    const response = await fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`);
    const data = await response.json();

    container.innerHTML = '';
    if (data.meals) {
      data.meals.forEach(recipe => {
        container.appendChild(createRecipeCard(recipe));
      });
    } else {
      container.innerHTML = '<p class="no-results">No recipes found</p>';
    }
  } catch (error) {
    console.error('Error searching catalog:', error);
    const container = document.getElementById('catalogRecipes');
    if (container) container.innerHTML = '<p class="error">Search failed</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('index.html') || path.endsWith('/')) {
    loadTrendingRecipes();
  } else if (path.includes('catalog.html')) {
    loadCatalogRecipes();
    
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const catalogSearch = document.getElementById('catalogSearch');
    
    if (countryFilter) countryFilter.addEventListener('change', filterByCountry);
    if (typeFilter) typeFilter.addEventListener('change', filterByCountry);
    if (catalogSearch) catalogSearch.addEventListener('input', (e) => searchCatalog(e.target.value));
  } else if (path.includes('recipe.html')) {
    loadRecipeDetails();
  }
});
