// jQuery ready function to setup the page when it loads.
$.when( $.ready ).then(() => {
    document.title = 'Element Classification Lab';
    // Check the the service is ready
    checkReady((isReady) => {
        if (isReady) {
            $('.alert').hide()
        }    
    })
    // Hide the spinner overlay
    $('.overlay').hide()
    // Define the onclick event for the parse button
    $('#parsebtn').click((e) => {
        e.preventDefault();
        var formData = new FormData();
        var fileField = $('#file')

        formData.append('file', fileField[0].files[0]);

        fetch('parse', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log(response);
            return response.json() // Serialize the response to JSON
        })
        .catch(error => console.error('Error:', error));
    })
});

var categoryHash = {}
var typeHash = {}
var sentenceRefs = []

function resetView() {
    this.categoryHash = {}
    this.typeHash = {}
    this.sentenceRefs = []
    $('.alert').hide()
    $('.document-text').html('')
    $('.categories').html('')
    $('.types').html('')
}

function checkReady(cb) {
    $.get('/ready', (isReady, status) => {
        if (!isReady.ready) {
            $('.error-message').text(isReady.message)
            $('.alert').show()
            return cb(false)
        }
        return cb(true)
    })
}

// Process the response from the Element Classification call
function handleParseResponse(parseResponse) {
    $('.collapse').collapse()
    $('.document-text').html(tagHtmlDocument(parseResponse.document_text, parseResponse.elements))
    console.log(parseResponse.elements)
    // Consolidate the elements into Categories and Nature and Parties
    getUniqueElements(parseResponse.elements)
    // Add the categories to the left side
    addCategoriesToView()
    // Add the nature and parties to the left side
    addNaturePartiesToView()
    // Add event lister to the Element Links
    $('.element-link').click(onElementLinkClicked)
    // Select the first element
    
}

// Build the HTML with the Nature and Party list.
function addNaturePartiesToView() {
    let buff = '<strong>Nature and Parties</strong><ul class="list-group">'
    for (type in typeHash) {
        buff += '<li class="list-group-item d-flex justify-content-between align-items-center element-link"' +
            ' data-id="natureparty.' + 
            type + '">' + 
            type + '<span class="badge badge-primary badge-pill">' + 
            typeHash[type].count + '</span></li>'
    }
    buff += '</ul>'
    $('.types').html(buff)
}

// Build the HTML with the Categories list.
function addCategoriesToView() {
    let buff = '<strong>Categories</strong><ul class="list-group">'
    for (category in categoryHash) {
        buff += '<li class="list-group-item d-flex justify-content-between align-items-center element-link"' +
            ' data-id="category.' + 
            category + '">' + 
            category + '<span class="badge badge-primary badge-pill">' + 
            categoryHash[category].count + '</span></li>'
    }
    buff += '</ul>'
    $('.categories').html(buff)
}

// Event listener function that will be called when a Class is clicked.
function onElementLinkClicked(e) {
    $('.list-group-item.active').removeClass('active');
    $(e.target).addClass('active')

    if (sentenceRefs.length > 0) {
        clearHighlights(sentenceRefs)
    }
    let split = $(e.target).data('id').split('.')
    if (split[0] === 'category') {
        sentenceRefs = categoryHash[split[1]].sentences
    }
    if (split[0] === 'natureparty') {
        sentenceRefs = typeHash[split[1]].sentences
    }
    highlightSentences(sentenceRefs)
}

// Clears the previous highlighted sentences from the display
function clearHighlights(sentenceRefs) {
    for (ref of sentenceRefs) {
        $('#' + ref).removeClass('highlight')
    }
}
// Highlight the sentences for the selected class
function highlightSentences(sentenceRefs) {
    for (ref of sentenceRefs) {
        $('#' + ref).addClass('highlight')
    }
}
// Build the Hash objects with the unique categories and natureparties.
function getUniqueElements(elements) {
    for (let element of elements) {
        let key = 's' + element.sentence.begin
        for (let category of element.categories) {
            if (categoryHash[category.label]) {
                categoryHash[category.label].count++;
            } else {
                categoryHash[category.label] = { 'count': 1, sentences: [] } 
            }
            categoryHash[category.label].sentences.push(key);
        }
        for (let type of element.types) {
            let np = type.label.nature + ' - ' + type.label.party
            if (typeHash[np]) {
                typeHash[np].count++
            } else {
                typeHash[np] = { 'count': 1, sentences: [] }
            }
            typeHash[np].sentences.push(key);
        }
    }
}
