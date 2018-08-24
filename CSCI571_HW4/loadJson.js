/* exported getJSON(thisForm) */

function getJSON(thisForm) {
    "use strict";
    var URL = thisForm.input_json.value;
    var tempUrl = URL;
    while (tempUrl.lastIndexOf(" ") >= 0) {
        tempUrl = tempUrl.replace(" ", "");
    }

    if (tempUrl.length == 0) {
        window.alert("Cannot just enter white space!");
        return;
    }
    //console.log(URL);
    if (URL == "Please enter a Json file name...") {
        window.alert("Please enter a file name!");
        return;
    }
    //console.log(URL);
    var jsonObj = loadJSON(URL);
    if (jsonObj == null) {
        return;
    }
    //console.log(jsonObj);

    if (window.ActiveXObject) //if IE, simply execute script (due to async prop).
    {
        if (jsonObj.parseError.errorCode != 0) {
            var myErr = jsonObj.parseError;
            generateError(jsonObj);
            new_win = window.open("", "Error", "height=300,width=340");
            new_win.document.write(html_text);
        } else {
            generateHTML(jsonObj);
            new_win = window.open("", "Homework 4", "height=1200,width=1000");
            new_win.document.write(html_text);
        }
    } else //else if FF, execute script once JSON object has loaded
    {
        var html_text = writeHTML(jsonObj);
        var new_win = window.open("", "Homework 4", "height=1200, width=1000");
        new_win.document.write(html_text);
    }
    new_win.document.close();

}

function loadJSON(url) {
    "use strict";
    var flag;
    var xml_http;
    var jsonObj;
    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
        //console.log("1");
        xml_http = new XMLHttpRequest();
        //console.log(xml_http);
    } else { // code for IE6, IE5
        xml_http = new ActiveXObject("Microsoft.XMLHTTP");
        if (!xml_http) {
            window.alert("Cannot create XMLHttpRequest object");
        }
    }

    xml_http.open("GET", url, false);
    xml_http.onreadystatechange = function () {

        if (xml_http.readyState == 4) {

            //console.log (xml_http.status);
            if (xml_http.status == 200) {
                //console.log("response:" + xml_http.responseText);
                flag = 1;
            } else {
                window.alert("No such JSON file!");
                //console.log("response:" + xml_http.responseText);
                flag = 0;
                return;
            }
        }
    };
    try {
        xml_http.send();
    } catch (error) {
        window.alert("Fail to send request");
        return null;
    }

    if (flag == 1) {
        jsonObj = JSON.parse(xml_http.responseText);
        //console.log(xml_http.responseText);
        return jsonObj;
    } else {
        return null;
    }


}

function writeHTML(jsonObj) {
    var company = null;
    var header = jsonObj.Mainline.Table.Header.Data;
    //console.log(header);

    var html_text;
    html_text = "<!DOCTYPE html><html><head>";
    html_text += "<meta charset='utf-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'>";
    html_text += "<meta name='description' content='The fourth homework of CSCI 571 of USC'><meta name='author' content='Kuncheng Li'>";
    html_text += "<title>Trucking List</title></head><body style='width: 100%; margin: 0; padding: 0;'>";
    html_text += "<table style='width: 100%;'' border='2'>";
    html_text += "<tr>";
    for (var i = 0; i < header.length; i++) {
        //console.log(header[i]);
        html_text += "<th>" + header[i] + "</th>";
    }
    html_text += "</tr>";
    company = jsonObj.Mainline.Table.Row;
    console.log(company);
    if (company != null) {

        for (var i = 0; i < company.length; i++) {
            company_list = company[i];
            company_keys = Object.keys(company_list);
            html_text += "<tr>";
            for (var j = 0; j < company_keys.length; j++) {
                var key = company_keys[j];
                if (key == "Logo") {
                    var x = 310;
                    y = 120;
                    console.log(company_list[key]);
                    html_text += "<td><a href='" + company_list[key] + "' target='_blank'><img alt='' src='" + company_list[key] + "' width='" + x + "' height='" + y + "'/></a></td>";
                } else if (key == "HomePage") {
                    html_text += "<td><a href='" + company_list[key] + "'>" + company_list[key] + "</a></td>";
                    //console.log("<td><a href='" + company_list[key] + "'></a></td>");
                    console.log(company_list[key]);
                } else if (key == "Hubs") {
                    var hub_key = Object.keys(company_list[key]);
                    var hub_arr = company_list[key][hub_key];
                    var hub_len = hub_arr.length;
                    html_text += "<td><ul>";
                    if (hub_len > 0) {
                        html_text += "<li type='disc' style='margin-bottom:20px;'><b>" + hub_arr[0] + "</b></li>";
                        for (var k = 1; k < hub_len; k++) {
                            html_text += "<li type='disc'>" + hub_arr[1] + "</li>";
                        }
                    }
                    html_text += "</ul></td>"
                    //console.log(hub_arr[0]);
                } else {
                    html_text += "<td>" + company_list[key] + "</td>";
                }
            }
        }
        html_text += "</tr>";
    } else {
        window.alert("No Company information");
        return html_text;
    }

    //console.log(h_keys);
    html_text += "</table></body></html>";
    // console.log(company.length);
    return html_text;
}
