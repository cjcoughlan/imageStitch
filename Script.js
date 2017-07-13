$(document).ready(function(){
  
  //Typeahead remote data call 
  var TAContent = function(q, cb, cbAsync){
    $.ajax ({
      url: _spPageContextInfo.siteAbsoluteUrl + "/_api/search/query?querytext='" + q + "*+path:\""+ _spPageContextInfo.webAbsoluteUrl + "\"'",
      // data: {
      //   country: $('#claimant_country').val()
      // },
      headers: {
        'Accept':'application/json;odata=verbose'
      },
      cache: false,
      success: function (data) {

        //var results = data.d.query;
        var results = data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results;

        //loop through results to pass back in some type of cleaner method than the gobbledegook from the search REST api :(
        var searchContent = [];

        //cb(['This suggestion appears immediately', 'This one too']);

        $.each(results, function (index, result) {
            
            //check browser version, if not ie, open in web view

            //If this is a document append web=1 to the path
            var docQueryString = (result.Cells.results[29].Value == "true") ? "?web=1" : "";

            var obj = {
              Title: result.Cells.results[3].Value,
              OriginalPath: result.Cells.results[6].Value + docQueryString
            }

            //push to searchContent
            searchContent.push(obj);

        });

        cbAsync (searchContent);
      }
    });
  }

    //CJC New Typeahead code
    $('.uponor-autocomplete-search').each (function (index, elem) {
      //Save off current object
      var curItem = $(elem);

      //attach typeahead 
      curItem.typeahead({
        highlight: true,
        hint: false,
        minLength: 3
      },{
        name: 'ta-results',
        limit: 50,
        displayKey: 'Title',
        source: TAContent ,
        templates: {
          suggestion: function(data){
            return '<p>' + data.Title + '</p>';
          }
        }
      })
      .on('typeahead:asyncrequest', function() {
          curItem.addClass('ui-autocomplete-loading');
      })
      .on('typeahead:asynccancel typeahead:asyncreceive', function() {
          curItem.removeClass('ui-autocomplete-loading');
      })
      .on('typeahead:selected', function(obj, datum) {
          //curItem.closest ('table').find ('.uponor-autocomplete-zip').val (datum.zip);

          window.location.href = datum.OriginalPath;
      });
    });

    //FAQ Accordian call, tie based on element id
    $("#faq-tabs").each(function(){

      //save off this element
      var faqsHTML = "", giftsHTML = "", grantsHTML = "";          

      //pull faq content
      $.ajax ({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('FAQ')/Items?$select=Title,Answer,FAQ_x0020_Type",
        headers: {'Accept':'application/json;odata=verbose'},
        cache: false,
        success: function (data) {

          var results = data.d.results;

          //parse out to different sections

          for (var i = 0; i < results.length; i++) {

            switch(results[i].FAQ_x0020_Type){
              case "VTO":
                faqsHTML = faqsHTML + "<div class=\"panel panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\"><a data-toggle=\"collapse\" data-parent=\"#accordion\""+
                                  "href=\"#collapse"+i+"\">"+results[i].Title+"</a></h4></div><div id=\"collapse"+i+"\" class=\"panel-collapse collapse\"><div class=\"panel-body\">"+
                                  results[i].Answer+"</div></div></div>";
                break;
              case "Grants":
                grantsHTML = grantsHTML + "<div class=\"panel grants panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\"><a data-toggle=\"collapse\" data-parent=\"#accordion\""+
                                  "href=\"#collapse"+i+"\">"+results[i].Title+"</a></h4></div><div id=\"collapse"+i+"\" class=\"panel-collapse collapse\"><div class=\"panel-body\">"+
                                  results[i].Answer+"</div></div></div>";
                break;
              case "Matching Gifts":
                giftsHTML = giftsHTML + "<div class=\"panel gifts panel-default\"><div class=\"panel-heading\"><h4 class=\"panel-title\"><a data-toggle=\"collapse\" data-parent=\"#accordion\""+
                                  "href=\"#collapse"+i+"\">"+results[i].Title+"</a></h4></div><div id=\"collapse"+i+"\" class=\"panel-collapse collapse\"><div class=\"panel-body\">"+
                                  results[i].Answer+"</div></div></div>";
                break;
            }                
          }

          //append html to accordian sections
          $(".faq-group").each(function(){

              var curItem = $(this);

              switch(curItem.attr("id")){
                case "accordion-one":
                  curItem.append(faqsHTML);
                  break;
                case "accordion-two":
                  curItem.append(grantsHTML);
                  break;
                case "accordion-three":
                  curItem.append(giftsHTML);
                  break;
              }

          });         
          
        }

      });

    });  

    //Image Stitch
    $(".images-container").each(function(){

      

      //cache object
      var curItem = $(this);

      //pull main image content
      $.ajax ({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('Main.Image')/Items?$select=Title,Description,Article_x002e_Link,Position,FileRef,EncodedAbsUrl",
        headers: {'Accept':'application/json;odata=verbose'},
        cache: false,
        success: function (data) {

          var results = data.d.results;
          var imageNumber=0;
          var imagePosition=0;

          for (var i = 0; i < results.length; i++) {            

            imageNumber = i+1;
            imagePosition = (results[i].Position) ? results[i].Position : 0;

            //Determine if this is an external link, if so open in new tab
            if (results[i].Article_x002e_Link){
              var newTarget = (results[i].Article_x002e_Link.indexOf("uponor-usa.com") !== -1) ? "_self" : "_blank";
            }  

            //ADD LOOKUP OF FILETYPE TO HANDLE VIDEO

            curItem.find("#image-"+imagePosition)
                      .find("a.wrapper").prop("href",results[i].Article_x002e_Link).attr("target",newTarget)
                        .find("h3.tile__title").text(results[i].Title).end()
                        .find("p.tile__tagline").text(results[i].Description).end()
                        .find("img").prop("src",results[i].EncodedAbsUrl)
                                
          }

        }
      });

    });
    //Events
    $("#eventList").each(function(){

      //cache object
      var curItem = $(this);
      var eventsHTML = "";

      //pull main image content
      //TODO ********** Pull events based on current date minus two weeks**********
      $.ajax ({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('VTO.Events')/Items?$select=DetailLink,Title,EventDate,EncodedAbsUrl,Event_x0020_Type&$orderby=EventDate asc",
        headers: {'Accept':'application/json;odata=verbose;charset=utf-8'},
        cache: false,
        success: function (data) {

          var results = data.d.results;
          var currentMonth = 0;
          var newMonth = false;

          var month = new Array();
              month[1] = "January";
              month[2] = "February";
              month[3] = "March";
              month[4] = "April";
              month[5] = "May";
              month[6] = "June";
              month[7] = "July";
              month[8] = "August";
              month[9] = "September";
              month[10] = "October";
              month[11] = "November";
              month[12] = "December";

          
          //TODO ********** Determine how to put month header in prior to month's events **********
          for (var i = 0; i < results.length; i++) {

            //Determine month
            var eventMonth = parseInt(results[i].EventDate.substr(5,2));
            var newMonth = (currentMonth != eventMonth); 

            if (newMonth){
              eventsHTML = eventsHTML + "<h4 class=\"event-month\">" + month[eventMonth] + "</h4>";
              //curItem.append(monthHeader);
              currentMonth = eventMonth;
            }

            //Get event date
            var eventDay = (results[i].EventDate) ? results[i].EventDate.substr(8,2).replace("-","/") : "";

            //Determine if this is an external link, if so open in new tab
            if (results[i].DetailLink){
              var newTabTarget = (results[i].DetailLink.indexOf("uponor-usa.com") !== -1) ? "" : "target=\"_blank\"";
            }            

            //determine event type class
            var eventClass = (results[i].Event_x0020_Type == "VTO" || results[i].Event_x0020_Type == "Sponsor") ? results[i].Event_x0020_Type.toLowerCase() + "-event" : "other-event";

            eventsHTML = eventsHTML + "<div class=\"event-wrap\"><div class=\"event\"><a href=\""+results[i].DetailLink+"\" "+newTabTarget+" ><div class=\"event-day "+eventClass+"\"><p>"+eventDay+"</p></div><div class=\"event-title "+eventClass+"\"><p>"+
                                      results[i].Title+"</p><p>"+results[i].Event_x0020_Type+"</p></div><img src=\""+results[i].EncodedAbsUrl+"\"></img></a></div></div>";
                                            
          }

          curItem.append(eventsHTML);

        }

      });

    });

    //Fix ics links
    // var calendarLink = $("a[href*='.ics']");
    // var newLink = calendarLink.clone();

    // newLink.attr("type","text/attachment");
    // newLink.insertBefore(calendarLink);
    // calendarLink.hide();

    //Set external links to open up in new tab
    $("a[href*='http']").not("[href*='uponor-usa.com'],[href*='javascript'], .wrapper").attr("target","_blank");

    //Set pdfs to open in new tab
    $("a[href*='pdf']").attr("target","_blank");

    //Handle Event Pill Click ***********ADD FILTER HERE*************
    $('ul.nav.nav-pills li a').click(function() {           
      $(this).parent().addClass('active').siblings().removeClass('active');           
    });

});

