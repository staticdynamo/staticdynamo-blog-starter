---
layout: none
permalink: "/:path/search-1.0.0.js"
---

$(document).ready(function() {

    var indexedPosts = null;
    var lunrIndex = null;

    // Build search index
    $.getJSON("/api/posts/", function(posts) {
        indexedPosts = posts;
        lunrIndex = lunr(function () {
            this.field('title');
            this.field('excerpt');
            this.field('categories');
            this.field('tags');
            this.ref('id');

            for (var i in posts) {
                this.add({
                    title: posts[i].title,
                    excerpt: posts[i].excerpt,
                    categories: posts[i].categories,
                    tags: posts[i].tags,
                    id: i
                });
            }
        });
    });

    // Listen to the search event from SearchForm(s) on the page.
    document.addEventListener(Dynamo.SearchForm.SEARCH_EVENT_NAME, function(e) {
        var query = e.detail.query;
        if (query.length > 0 && lunrIndex !== null) {
            // Perform the actual search using the lunr index
            var lunrResults = lunrIndex.query(function(q) {
                query.split(lunr.tokenizer.separator).forEach(function(term) {
                    q.term(term, { boost: 100 });
                    if (query.lastIndexOf(" ") != query.length-1) {
                        q.term(term, { usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 });
                    }
                    if (term != "") {
                        q.term(term, { usePipeline: false, editDistance: 1, boost: 1 });
                    }
                });
            });

            // Get and normalize the top N search results
            var results = new Array();
            for (var i = 0; i < lunrResults.length; i++) {
                if (i >= {{ site.search.lunr.settings.num_of_search_results | default: 5 }}) {
                    break;
                }
                var doc = indexedPosts[lunrResults[i].ref];
                var searchResult = new Dynamo.SearchResult(
                    "post", doc.url, doc.title, doc.excerpt
                );
                results.push(searchResult);
            }

            // Dispatch the search complete event with the search results
            e.target.dispatchEvent(
                new CustomEvent(Dynamo.SearchForm.SEARCH_COMPLETE_EVENT_NAME, {
                    detail: {
                        searchResults: results,
                    },
                })
            );
        }
    });
});