"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

 function generateStoryMarkup(story, showDeleteBtn = false) {
  console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if a user is logged in, show favorite/not-favorite star
  const showStar = Boolean(currentUser);
  return $(`
      <li id="${story.storyId}">
        ${showDeleteBtn ? deleteBtn() : ""}
        ${showStar ? favoriteBtn(story, currentUser) : ""}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");
  $allStoriesList.empty();
  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  $allStoriesList.show();
}

function putUserStoriesOnPage() {
  console.debug("putUserStoriesOnPage");
  $myStory.empty();
  if (currentUser.ownStories.length === 0) {
    $myStory.append("<h3>Nothing added</h3>");
  } else {
    //Loop through users stories 
    for (let story of currentUser.ownStories) {
      let $story = generateStoryMarkup(story, true);
      $myStory.append($story);
    }
  }
  $myStory.show();
}

function putFavoritesListOnPage() {
  console.debug("putFavoritesListOnPage");
  $favoritedStories.empty();
  if (currentUser.favorites.length === 0) {
    $favoritedStories.append("<h3>Nothing added</h3>");
  } else {
    //Loop through users favorites
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

async function deleteStory(evt) {
  console.debug("deleteStory");
  const $closestLi = $(evt.target).closest("li");
  const storyId = $closestLi.attr("id");
  await storyList.removeStory(currentUser, storyId);
  //show Story list
  await putUserStoriesOnPage();
}

$myStory.on("click", ".trash-can", deleteStory);

async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();
  //get value from form
  const title = $("#create-title").val();
  const url = $("#create-url").val();
  const author = $("#create-author").val();
  const username = currentUser.username
  const storyData = {title, url, author, username };

  const story = await storyList.addStory(currentUser, storyData);
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);
  //form clear
  $submitForm.slideUp("slow");
  $submitForm.trigger("reset");
}

$submitForm.on("submit", submitNewStory);

async function toggleStoryFavorite(evt) {
  console.debug("toggleStoryFavorite");
  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find(s => s.storyId === storyId);
  // check favorite through attribute
  if ($tgt.hasClass("fas")) {
    // remove from favorite and change attribute
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    // add to favorite and change attribute
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}

//Button
function deleteBtn() {
  return `<span class="trash-can"> <i class="fas fa-trash-alt"></i> </span>`;
}

function favoriteBtn(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `<span class="star"> <i class="${starType} fa-star"></i> </span>`;
}

$storiesLists.on("click", ".star", toggleStoryFavorite);
