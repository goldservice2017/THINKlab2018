# THINK 2018 
## Compare and Comply: [Element Classification](https://console.bluemix.net/docs/services/discovery/element-classification.html#element-classification) Lab

---

## Goals
The goal of this lab is to:
1. Give you an introduction to **Watson Compare and Comply:** _Element Classification_ 
2. Teach you how to call the Element Classification API 
3. Illustrate the value of the semantic data extracted from your PDF documents
4. Spark ideas around optimizing existing business processes by leveraging the output of Element Classification


***Note:** Element Classification is available on both [Watson Discovery](https://www.ibm.com/watson/services/discovery/) and [IBM Cloud Private](https://www.ibm.com/cloud-computing/products/ibm-cloud-private/). This lab will focus on the value derived from the output of Element Classification, with an experience most similar to IBM Cloud Private.*

---
## Overview
**Watson Compare and Comply:** _Element Classification_ makes it possible to rapidly parse through governing documents to convert, identify, & classify elements of importance. Using state of the art Natural Language Processing, party (who it refers to), nature (the type of element), & category (specific class) are extracted from elements of a document.

Watson Compare and Comply: Element Classification is designed to provide:
- Natural Language Understanding of Contractual documents
- The ability to convert programmatic PDF to annotated JSON
- Identification of legal Entities and Categories that align with subject matter expertise
	
Watson Compare and Comply: Element Classification brings together a functionally rich set of automated Watson technologies to convert & classify programmatic PDFs. It processes a PDF document into a structured HTML format, identifying sections, lists, footnotes, and tables. Then it parses the aforementioned elements and annotates them with domain-specific types and categories. Finally, surfacing these insights to the user in a JSON format. 

Watson Compare and Comply: Element Classification securely transmits your data performing encryption in flight and at rest. For information about IBM Cloud security, see the IBM Cloud Service Description.

---
## Getting Started
### Cloning the Code
Start by opening up your terminal. Change into the directory of your choosing, e.g. `cd ~/Desktop`. Next, clone a copy of this repository, using the git command `git clone https://github.com/reah/THINKlab2018.git`. Finally, enter the root directory of the lab, `cd THINKlab2018`.

### Installing dependencies

To install the dependencies needed in order for this application to work, run the command `npm install` from the root folder.

### Run the application

To run the application and open the client in your default browser, run `npm run develop` from the root folder of the application directory.

### Application Code Components

#### index.js

This is the Node.js application file.  Express.js is used to implement HTTP routing to serve the HTML page and receive requests from the client, namely uploading and parsing a PDF document using the Element Classification API. 

#### client/index.html

This file is the only HTML file in the application.  It is served by the Node.js & Express.js server when the URL is accessed. The index.html imports some javascript files with the main logic for the application.

#### client/scripts/main.js

This is the main javascript file that implements all the logic for the web page that uploads the PDF document and displays the response to the user.

#### client/scripts/htmltagger.js

This file contains the logic to parse the returned HTML text and insert tags into the HTML to be selected when specific categories or types are selected to be annotated.

---
## Part 1:
### I. Identify appropriate documents to analyze
The current version of Watson Compare and Comply: Element Classification has been designed to analyze contract style documents that meet the following criteria:
- Files to be analyzed are in PDF format & programmatically created, i.e. not scanned. 
*(Note: You can identify a programmatic PDF by opening the document in a PDF viewer and using the Text select tool to select a single word. If you cannot select a single word in the document, the file cannot be parsed.)*
• Files are no larger than 50Mb in size
• PDF files are not restricted nor secured, i.e. they are not password protected

We will be using the PDFs found in the folder titled [**sample-PDFs**](sample-PDFs/) for this lab. 

### II. Call the API using [Postman](https://www.getpostman.com)
Postman is a developer tool that will help us test our API call and examine the response. Launch Postman and follow the steps below to build your first Element Classification API call:
1. Create a new **POST** request with the following URL: 
`https://gateway.watsonplatform.net/compare-and-comply-experimental/api/v1/parse`
2. Authorize your API call with valid credentials. 
*(Note, credentials were created for the purposes of this lab ahead of time).* 
Navigate to the **Authorization** tab and select **Type: Basic Auth**. 
Enter **username:** `7a9630c0-3303-4cb2-a4b3-51afcde7b8e4` and **password:** `yckj8uQARQBb`.
3. Set the query parameters. For a valid API request, we need to specify some required query parameters. Click on the **Params** button to the right of the URL to set the following query parameters as key-value pairs:
	- `version`: `2017-10-30` *(the specific API version)*
	- `subdomain`: `contract` *(the specific subdomain of focus)*
	- `analyze`: `true` or `false` *(whether or not to classify elements, if this is set to false only the structured HTML conversion of the original PDF will be returned)*
	- `categorize`: `true` or `false` *(whether or not to include categories for each element)*
4. Attach the file you want to parse to the body of the request. Navigate to the **Body** tab, select **form-data**, and set a **key** named `file` of type **file**. Select the file you want to send as part of the request as the `value`.
5. Finally, **send** your API request and receive a parsed response!

### III. Examine the API response
The API response is formatted in JSON and should look something like:
```
{
	"document_text": "<html>...</html>",
	"document_title": "title",
	"elements": [...],
	"parties": [...]
}
```
- `document_text` corresponds to the **structured HTML representation of the original PDF**
- `document_title` corresponds to the **title of the document**


The `elements` array contains a series of objects, each object describes an element of the contract that Element Classification identified. Below is an example of a typical element:
```
{
   "sentence" : {
     "begin" : 34941,
     "end" : 35307
   },
   "sentence_text" : "Buyer may, upon written notice to Supplier, terminate a SOW or WA.",
   "types" : [ {
     "label" : {
       "nature" : "Right",
       "party" : "Buyer"
     },
     "assurance" : "High"
   } ],
   "categories" : [ {
     "label : "Term & Termination",
     "assurance : "High"
     }
   ]
}
```

There are four important parts of an element object:

- `sentence_text` describes **the text that was analyzed**
- `sentence` is an **object describing where the element was found in the converted HTML**. This object contains a start character position, `begin`, and an end character position, `end`.
- `types` is an array describing **what the element is** and **who it affects**. It consists of one or more sets of `party` (who is being affected by the sentence) and `nature` (the effect of the sentence on the identified party).
- `categories` is an array of the functional categories (the subject matter) of the identified sentence.
*Note: Some sentences do not fall under any type or category, in which case the types and categories arrays are returned empty.*
*Note: Some sentences cover multiple topics and will therefore be returned with multiple types and categories items listed.*

Additionally, the `parties` array contains any identified **parties**.
```
  "parties" : [ {
    "party" : "Customer",
    "role" : "Buyer"
  } ]
```
There are two important sections to each object in the `parties` array:

- `party` is the text that was identified as a **party in the document**.
- `role` is the **specific role of the party** that has been identified. 
*Note: Roles change based on sub-domain, see the information on the specified sub-domain for a list of possible roles. Parties that cannot be identified to a specific role are labeled as Unknown.*

### IV. Understanding Contract Elements
Parsed contracts from Element Classification are returned with each identified element analyzed.
The following sections describe how the returned JSON describes the analysis.

#### Type
The following tables describe the `nature` and `party` values that can be identified.

**Nature is the type of action the sentence requires.**

| Nature | Description | 
| --- | --- |
| Definition | This element adds clarity for a term/relationship/etc. Action is not required to fulfill this element and no party is affected.|
| Disclaimer | The party in the element is not obligated to fulfill the specific terms in the element, but is not barred from doing so. |
| Exclusion | The party in the element will not fulfill the specific terms laid out in the element.|
| Obligation | The party in the element is required to fulfill the terms of the element.|
| Right | The party in the element is guaranteed to receive the terms of the element.|

#### Parties
For each identified clause, affected parties are identified by name. Each identified party is then classified by `role`. Parties are the participants in the contract. The roles that can be identified for a contract are as follows:

|Role|Description|
|---|---|
|Buyer|The party responsible for paying for the goods/services.|
|End User|The party who will interact with the actual goods/services, explicitly distinguished from the Buyer.|
|None|No party has been identified for this element, always paired with the Definition nature.|
|Supplier|The party responsible for providing the goods/services.|

#### Categories 
Categories define the subject matter of the sentence. The following currently supported categories can be identified:

|Categories|	Description|
|---|---|
|Assignments|	Encompasses the transfer of rights held by one party to another.|
|Confidentiality|	Describes how confidential or private information will be handled such as who can share what, and how.|
|Deliverables|	The items or services to be delivered at the end of a piece of work.|
|Delivery| Describes the action of delivering a good or service. |
|Dispute Resolution	|Provides for any dispute arising between contracting parties, and how it will be handled.|
|Force Majeure|	A clause that frees both parties from liability in case of a disruptive event.|
|Indemnification|	Describes the remedies or consequences if terms are breached.|
|Insurance|	Describes the level of insurance coverage a supplier must carry.|
|Intellectual Property|	A clause that relates to patents, copyrights and trademarks. More generally may relate to invention, authorship or know-how.|
|Liability|	Describes obligations and limitations on the responsibility of each party.|
|Payment Terms & Billing|	Describes what payments are due and what the schedule for payment is.|
|Pricing & Taxes|	Describes how the prices are made up and how the taxes are to be applied|
|Privacy|	Describes the privacy regulations which apply.|
|Responsibilities| Describes tasks ancillary to the agreement, over which only one of the parties has oversight and control. |
|Scope of Work|  Describes what is in the contract and what is not.|
|Subcontracts| Describes the hiring third parties to perform certain duties under the contract and the permissions, rights, restrictions, and consequences thereto and arising therefrom.|
|Responsibilities|	Describes what the responsibilities of each party are.|
|Term & Termination|	The time over which something will happen, and the conditions under which it may end.|
|Warranties|	Guarantee by a supplier of how a product will work.|

#### Assurance
Every item (type or category) identified by Element Classification is given an `assurance` rating. The possible assurance values are described below:

|Assurance|	Description|
|---|---|
|High|	There is significant evidence that the classification given is representative of the content.|
|Low|	There is some evidence to support the classification, but it may need further review to confirm.|

---

## Part 2: Dive into the Code

### I. Authenticate
For this part of the lab, use your favorite text editor to open up the root folder `THINKlab2018` and dive into the code.
The credentials for the Element Classification instance used in this lab were created ahead of time for you. Use the same credentials that you used in Part 1, place your username and password appropriately into the `.env` file.

### II. Build the URL 
Look for the comment `// Build the URL with the parameters from Part 1` in the `index.js` file. Here you will use the API base URL and parameters from Part 1 to build a valid URL, `var url` to make a request. Note, query parameters are denoted by a `?` after the base URL and are associated as key-value pairs using a `=`, separated by an `&`. For example, in `http://reah.me/path?name=reah&title=product-manager`, the base URL is `http://reah.me/path`, the `?` denotes the beginning of the query parameters, the first query parameter has a key `name` with value `reah`, and the second query parameter has a key `title` with value `product-manager`.

### III. Print the response
Find the part in the code where the request is made and the response is returned. Print the `body` of the response to visualize the JSON returned by Element classification. The response should look similar to Part 1, and for your convenience a sample response can be found in the file `sample-response.json`.

#### IV. 

