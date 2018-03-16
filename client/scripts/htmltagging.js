function tagHtmlDocument(htmlText, sentences) {
	this.htmlText = htmlText;
	this.sentences = sentences || [];
	this.sentences.sort(function(a, b) {
		return a.sentence.begin - b.sentence.begin;
	});
	return _generateLabeledHtmlText()
}

// private methods
function _generateLabeledHtmlText() {
	const html = [];
	const sentences = this.sentences;
	const docText = this.htmlText;
	let cursor = 0;
	for (let i=0; i < sentences.length; i++) {
		const sentence = sentences[i].sentence;
		const adjust = this._parse(sentence, docText.substring(sentence.begin, sentence.end));
		if (cursor < sentence.begin) {
			html.push(docText.substring(cursor, sentence.begin));
		}
		html.push(adjust && adjust.prefix_close || "");
		html.push('<sentence id="s', sentence.begin, '">');
		html.push(adjust && adjust.prefix_open || "");
		html.push(docText.substring(sentence.begin, sentence.end));
		html.push(adjust && adjust.postfix_close || "");
		html.push('</sentence>');
		html.push(adjust && adjust.postfix_open || "");
		cursor = sentence.end;
	}
	html.push(docText.substring(cursor));
	return html.join('');
}

function _parse(sentence, htmlText) {
	const openTags = [];
	const closeTags = [];

	// parse html fragment and find unopened/unclosed tags
	let tag = this._findNextTag(htmlText);
	while (tag) {
		if (!tag.isComment && !tag.isSelfCloseTag) {
			if (!tag.isCloseTag) {
				openTags.push(tag);
			} else {
				let lastOpenTag = openTags[openTags.length - 1];
				if (lastOpenTag && lastOpenTag.name.toLowerCase() == tag.name.toLowerCase()) {
					openTags.pop();
				} else {
					closeTags.push(tag);
				}
			}
		}
		tag = this._findNextTag(htmlText, tag.end);
	}
	// exit if there is no unopened/unclosed tag
	if (openTags.length === 0 && closeTags.length === 0) { return null; }

	const adjust = { prefix_close: "", prefix_open: "", postfix_close: "", postfix_open: "" };

	// append close tag if there are unopned tags
	if (openTags.length > 0) {
		let openTag = openTags.shift();
		while (openTag) {
			adjust.postfix_close = '</' + openTag.name + '>' + adjust.postfix_close;
			adjust.postfix_open += openTag.text;
			openTag = openTags.shift();
		}
	}
	// find open tag from previous text if there are unopened tags
	// and insert them before
	if (closeTags.length > 0) {
		let start = sentence.begin - 1;
		let closeTag = closeTags.shift();
		while (closeTag) {
			adjust.prefix_close = '</' + closeTag.name + '>' + adjust.prefix_close;

			let foundOpenTag = this._findOpenTagBefore(closeTag, start);
			if (foundOpenTag) {
				adjust.prefix_open += foundOpenTag.text;
			} else {
				adjust.prefix_open += '<' + closeTag.name + '>';
			}
			closeTag = closeTags.shift();
			start = foundOpenTag.begin - 1;
		}
	}

	return adjust;
}

function _findNextTag(htmlText, start) {
	const begin = htmlText.indexOf('<', start);
	if (begin === -1) { return null; }
	const end = htmlText.indexOf('>', begin) + 1;
	if (end === 0) { return null; }
	const text = htmlText.substring(begin, end);
	return this._getTagInfo({ text: text, begin: begin, end: end});
}

function _findPrevTag(htmlText, start) {
	const begin = htmlText.lastIndexOf('<', start);
	if (begin === -1) { return null; }
	const end = htmlText.indexOf('>', begin) + 1;
	if (end === 0) { return null; }
	const text = htmlText.substring(begin, end);
	return this._getTagInfo({ text: text, begin: begin, end: end});
}

function _findOpenTagBefore(tag, start) {
	let closeTags = [];
	let foundTag = this._findPrevTag(this.htmlText, start);
	while (foundTag) {
		if (!foundTag.isComment || !foundTag.isSelfCloseTag) {
			if (foundTag.isCloseTag) {
				closeTags.push(foundTag);
			} else {
				let lastCloseTag = closeTags[closeTags.length - 1];
				if (lastCloseTag && lastCloseTag.name.toLowerCase() && foundTag.name.toLowerCase()) {
					closeTags.pop();
				} else {
					return foundTag;
				}
			}
		}
		foundTag = foundTag.begin > 0 ? this._findPrevTag(this.htmlText, foundTag.begin - 1) : null;
	}
	return null;
}

function _getTagInfo(tag) {
	const text = tag.text;
	const isComment = text.length > 1 && text.charAt(1) == '!';
	if (isComment) {
		return {
			begin: tag.begin,
			end: tag.end,
			text: text,
			isComment: true
		};
	}
	const isCloseTag = text.length > 1 && text.charAt(1) == '/';
	const isSelfCloseTag = text.length > 1 && text.charAt(text.length - 2) == '/';
	let nameEnd = text.length - (isSelfCloseTag ? 2 : 1);
	const space = text.indexOf(' ');
	if (space !== -1) {
		nameEnd = Math.min(space, nameEnd);
	}
	const n = text.indexOf('\n');
	if (n !== -1) {
		nameEnd = Math.min(n, nameEnd);
	}
	const t = text.indexOf('\t');
	if (t !== -1) {
		nameEnd = Math.min(t, nameEnd);
	}
	const name = text.substring(isCloseTag ? 2 : 1, nameEnd);
	return {
		begin: tag.begin,
		end: tag.end,
		text: text,
		name: name,
		isCloseTag: isCloseTag,
		isSelfCloseTag: isSelfCloseTag
	};
}
