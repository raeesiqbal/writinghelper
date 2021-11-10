class Tabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editor: "",
            keywords_to_detect: [],
            internal_articles: [],
            highlight_database_keywords: [],
            current_detected_keyword: "",
            highlight_tag: "<mark class=\"highlight-detect\">",
            highlight_tag_end: "</mark>",
            exact_matches_toggle_button_class: {true: "btn btn-primary", false: "btn btn-outline-primary"},
            exact_matches_toggle_value: false
        };
    }
    componentDidMount () {
        this.change_data("");

        var website_names = JSON.parse(this.props.websites.replaceAll("'", '"'));
        website_names.forEach(website => {
            var option = document.createElement("option");
            option.innerHTML = website.name;
            option.value = website.name;
            document.querySelector("#websites").appendChild(option);
        });
        if (!JSON.parse(this.props.is_admin)) {
            document.querySelector("#keywords-tab").innerHTML = "";
        }
        
    }
    render () {
        var update_cache = "";
        if (JSON.parse(this.props.is_admin)) {
            update_cache = <button class="btn btn-primary" onClick={this.update_cache}>Update cache</button>;
        }
        return (
            <div>
                <label for="main-keyword-input">Enter all the keywords to be detected seperated by a comma:</label>
                <div id="messages"></div>
                <input type="text" class="form-control" id="main-keyword-input" name="main-keyword-input" placeholder="Main Keyword"/>
                <div>
                    <div >
                        <label for="websites">Choose a website:</label>
                        <select name="website" id="websites">
                            <option value="">Please select a website</option>
                        </select>
                        <div id="toggle-button-div">
                            <button id="exact-matches-toggle-button" value={this.state.exact_matches_toggle_value} onClick={this.exact_matches_toggle} class={this.state.exact_matches_toggle_button_class[this.state.exact_matches_toggle_value]}>Exact matches</button>

                        </div>
                    </div>
                </div>
                <hr/>
                <div id="tabs-outer-container">
                    <div id="editor-container">
                            <div id="editorjs"></div>
                        <div class="buttons">
                            {update_cache}
                            <button class="btn btn-primary" onClick={this.database_keywords}>Get Keywords</button>
                            <button class="btn btn-primary" onClick={this.internal_articles}>Get Articles</button>
                            <button class="btn btn-primary" onClick={this.detect}>Detect</button>
                        </div>
                    </div>
                    <div id="tabs-container">
                        <hr class="no-margin"/>
                        <div class="hv"></div>
                        <div class="tab" id="keywords-tab">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Database Keywords</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.highlight_database_keywords.map((keyword, index) => {
                                            var tab_id = 1;
                                            var class_name = "";
                                            if ((index + (parseInt(tab_id) % 2)) % 2 === 1) {
                                                class_name = "white";
                                            }
                                            return (
                                                <tr>
                                                    <td class={class_name}>
                                                        <input onClick={this.highlight_keyword} type="radio" class="radio_to_hide database_keywords_radio" value={keyword} name="keywords" id={keyword}/>
                                                        <label for={keyword}>{keyword}</label>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                        <div class="hv"></div>
                        <div class="tab" id="articles-tab">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Articles</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.internal_articles.map((article, index) => {
                                            var tab_id = 2;
                                            var class_name = "";
                                            if ((index + (parseInt(tab_id) % 2)) % 2 === 1) {
                                                class_name = "white";
                                            }
                                            return (
                                                <tr>
                                                    <td class={class_name}>
                                                        <a href={article["link"]}>{article["keyword"]}</a>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                        <div class="hv"></div>
                        <div id="word-detection-tab" class="tab">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Word Detection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.keywords_to_detect.map((keyword, index) => {
                                            var tab_id = 3;
                                            var class_name = "";
                                            if ((index + (parseInt(tab_id) % 2)) % 2 === 1) {
                                                class_name = "white";
                                            }
                                            return (
                                                <tr>
                                                    <td class={class_name}>
                                                        <input onClick={this.highlight_keyword} type="radio" class="radio_to_hide keywords_to_detect" value={keyword} name="keywords" id={keyword}/>
                                                        <label for={keyword}>{keyword}</label>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>

                            </table>
                        </div>
                        <div class="hv"></div>
                        <hr class="no-margin"/>
                    </div>
                </div>
            </div>
        );
    }

    exact_matches_toggle = (event) => {
        if (event.target.value) {
            this.setState({
                exact_matches_toggle_value: !this.state.exact_matches_toggle_value
            });
            return;
        }
        this.setState({
            exact_matches_toggle_value: !this.state.exact_matches_toggle_value
        });
    }

    update_cache = () => {
        this.display_message("");
        fetch("update_cache").then(response => response.json())
        .then(response => this.display_message(response["message"]))
    }

    // gets all the headings and then sends them to the api. The api returns all the related articles and their links
    internal_articles = () => {

        const website_name = this.get_website_name();
        if (website_name === "error") {
            return;
        }
        // getting all the headings in the editor
        this.state.editor.save().then(outputData => {
            var headings = new Array();
            outputData.blocks.forEach(block => {
                if (block.type === "header") {
                    headings.push(block.data.text);
                }
            });
            console.log(headings)
            
            // converting each heading into its parts
            headings.forEach((heading, heading_index) => {
                headings[heading_index] = this.split_keyword(heading);
            })
    
    
            // calling the api to get all the related articles
            fetch("/get_related_articles", {
                method: "POST",
                body: JSON.stringify({
                    data: headings,
                    website: website_name
                })
            }).then(response => response.json())
            .then(articles => {
                this.setState({
                    internal_articles: articles
                });
            });
        })


    }

    // gets all the keywords from the backend and displays them in teh tab
    database_keywords = () => {
        const website_name = this.get_website_name();
        if (website_name === "error") {
            return;
        }

        fetch("/keywords", {
            method: "POST",
            body: JSON.stringify({
                website: website_name
            })
        }).then(response => response.json())
        .then(items => {
            var all_keywords = [];
            items.forEach(item => {
                all_keywords.push(item["keyword"]);
            });
            this.setState({
                highlight_database_keywords: all_keywords
            });
            if (!JSON.parse(this.props.is_admin)) {
                var target = document.createElement("input");
                target.className = "database_keywords_radio";
                target.value = "";
                target.checked = true;
                this.highlight_keyword({"target": target});
            }
        });



    }

    get_website_name = () => {
        const website_name = document.querySelector("#websites").value

        if (!website_name) {
            this.display_message("please select the website to fetch the keywords from first.");
            return "error";
        } else {
            this.display_message("");
            return website_name;
        }
    }

    // puts all the kwywords inside the detection tab
    detect = () => {
        this.setState({
            keywords_to_detect: []
        });
        var main_keyword_input = document.querySelector("#main-keyword-input");
        
        if (main_keyword_input.value == "") {
            this.display_message("please enter the keywords to detect first");
            return;
        } else {
            this.display_message("");
            // getting all the keywords, splitting them and removing the leading and trailing whitepaces
            var temp = main_keyword_input.value;
            temp = temp.split(",")
            temp.forEach((keyword, index) => {
                temp[index] = keyword.trim();
            });

            this.setState({
                keywords_to_detect: temp
            });
        }
        return false;
    }

    display_message = (message) => {
        var parent_element = document.querySelector("#messages");
        parent_element.innerHTML = "";
        
        if (message) {
            var warning_message = document.createElement("div");
            warning_message.innerHTML = message;
            warning_message.className = "alert alert-danger";
            
            parent_element.appendChild(warning_message);
        }
    }


    // manages the modification of text in the editor
    highlight_keyword = (event) => {
        var keywords = event.target.value;
        if (JSON.parse(this.props.is_admin)) {
            event.persist();
        }
        this.state.editor.save().then((outputData) => {

            if (!JSON.parse(this.props.is_admin) && event.target.className.includes("database_keywords_radio")) {
                keywords = this.state.highlight_database_keywords;

            } else {

                // if we deselect a keyword
                if (keywords === this.state.current_detected_keyword) {
                    this.setState({
                        current_detected_keyword: ""
                    });
                    event.target.checked = false;
                } else {
                    // changing the color of the keyword
                    this.setState({
                        current_detected_keyword: keywords
                    });
                }
                keywords = this.split_keyword(keywords);
            }

            // going through all the text and editing it
            outputData.blocks.forEach((block, index) => {
                keywords.forEach((keyword, keyword_index) => {

                    if (block.type != "header" && event.target.className.includes("database_keywords_radio")) {
                        return;
                    } else if (block.type === "paragraph" || block.type === "header") {
                        if (block.data.text) {
                            block.data.text = this.edit_block(block.data.text, keyword_index, event.target.checked, keyword);

                        }
                    } else if (block.type === "list") {
                        block.data.items.forEach((item, item_index) => {
                            if (item) {
                                block.data.items[item_index] = this.edit_block(item, keyword_index, event.target.checked, keyword);
                            }
                        });

                    }
                });
                outputData.blocks[index] = block;
            });
            
            this.change_data(outputData);

        })
        .catch((error) => {
        console.log('Saving failed: ', error)
        })
    }

    // converts a keyword into all of its subsets in decresing order by the number of words in each subset
    split_keyword = (keywords) => {

        if (this.state.exact_matches_toggle_value || !this.props.is_admin) {
            return [keywords];
        }
        // if we select a keyword
        keywords = keywords.split(" ");

        // getting all the parts of the keyword
        var temp_keywords = [];
        for (var j = 0; j < keywords.length; j++){
            for (var i = j + 2; i <= keywords.length; i++) {
                temp_keywords.push(keywords.slice(j, i).join(" "))
            }
        }
        return keywords.concat(temp_keywords).sort((a, b) => b.split(" ").length - a.split(" ").length);
    }

    // this function manages the highlighting and the removing of highlight in a block of text
    edit_block = (text, keyword_index, highlight, keyword) => {
        var mark_start = "<mark>";
        var mark_end = "</mark>";
        if (keyword_index === 0) {
            // removing all the highlighting first
            text = text.replaceAll(new RegExp(mark_start, "g"), "");
            text = text.replaceAll(new RegExp(mark_end, "g"), "");
        }

        if (highlight) {
            text = this.highlight(text, keyword);
        }
        return text;
    }


    // highlights all the text that matches the keyword
    highlight = (text, keyword) => {
        var regex = new RegExp(keyword, "ig");
        var matches = text.matchAll(regex);

        var indices_to_skip = 0;
        for (const match of matches) {

            var unique_keyword = true;
            for (var i = match.index; i >= this.state.highlight_tag_end.length - 1; i--) {

                var potential_end_tag = text.slice(i - this.state.highlight_tag_end.length, i);
                if (potential_end_tag === this.state.highlight_tag_end) {
                    break;
                } else if ((i + 1) >= this.state.highlight_tag.length) {
                    var potential_start_tag = text.slice(i - this.state.highlight_tag.length, i);
                    if (potential_start_tag === this.state.highlight_tag) {
                        unique_keyword = false;
                        break;
                    }
                }
            }

            if (!unique_keyword) {
                continue;
            }
            match.index += indices_to_skip;
            text = text.slice(0, match.index) + this.state.highlight_tag + match[0] + this.state.highlight_tag_end + text.slice(match.index + keyword.length, text.length + 1);
            indices_to_skip += this.state.highlight_tag_end.length + this.state.highlight_tag.length;
            
        }
        return text;

    }

    // creates a new editor with the modified text provideed as an argument
    change_data = (data) => {
        document.querySelector("#editorjs").innerHTML = "";
        this.setState({
            editor: new EditorJS({
                holder: "editorjs",
                autofocus: true,
                tools: {
                    header: {
                    class: Header,
                    inlineToolbar: ["link"]
                    },
                    list: {
                    class: List,
                    inlineToolbar: [
                        'link',
                        'bold'
                    ]
                    },
                    underline: Underline,
                    marker: Marker
                },
                data: data
            })
        });
    }

}
