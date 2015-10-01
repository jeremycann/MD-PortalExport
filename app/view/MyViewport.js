function expandTreePath(treeIndex)
{
  //Variable to hold the auto-created treepanel IDs with the elements first part of the named string using function getContentTreePanel().
  var treePanelHeader = ["treepanel-1013", "treepanel-1017", "treepanel-1021", "treepanel-1025", "treepanel-1029", "treepanel-1033", "treepanel-1037", "treepanel-1041", "treepanel-1045", "treepanel-1049"];
  //Variable used to cross refence button panels IDs in order to 
  var navTreesIds = ["capability_view_-_capabilities", "operational_view_-_nodes", "operational_view_-_organizational_relationships", "systems_view_-_resources", "systems_view_-_functions", "services_view_-_service_accesses", "services_view_-_interfaces", "standards", "dictionary", "data"];
  var componentPanelSearch = getContentTreePanel();
  var navTreePanel;
  var elementNode
  var pathOfTree;
  var childRecord;

  for (item in navTreesIds) {
    if (navTreesIds[item] === componentPanelSearch) {
      navTreePanel = Ext.getCmp(treePanelHeader[item]);
      treeButton = Ext.getCmp('button' + item);
      childRecord = navTreePanel.getRootNode().findChild('qtitle', treeIndex, true);
      pathOfTree = childRecord.getPath('text', '%%');
      treeButton.fireHandler();
      //Fire the event button clicked for the appropriate treeButton
      expandTree(navTreePanel, pathOfTree);
      navTreePanel.getSelectionModel().select(childRecord);
    }
  }
}


function expandTree(store, path, element){
  store.expandPath(path, 'text', '%%', function (s, n) {
    var nodeEl = Ext.get(store.view.getNode(n));
    nodeEl.scrollIntoView(store.view.el, false, true);
});
}

function getContentTreePanel(){
  var t = Runtime.globalContent_id;
  var re2 = /[0-9]/i;
  var regExNumberIndex = t.search(re2);
  var newString = t.substring(0,regExNumberIndex);
  return newString;
}

//var globalContent_id;
//Included a global Variable to the Runtime.js file

function containsRect(rect, X, Y)
{
    var w = rect.width;
    var h = rect.height;
    if ((w | h) < 0) {
        // At least one of the dimensions is negative...
        return false;
    }
    // Note: if either dimension is zero, tests below must return false...
    var x = rect.x;
    var y = rect.y;
    if (X < x || Y < y) {
        return false;
    }
    w += x;
    h += y;
    //    overflow || intersect
    return ((w < x || w > X) &&
            (h < y || h > Y));
}

function clickOnImage(map, x, y)
{
    for (var index in map)
    {
        for (var bounds in map[index])
        {
            if (containsRect(map[index][bounds], x, y))
            {
                navigate(index);
                setCursor('default');
                return;
            }
        }
    }
}

function moveOnImage(map, x, y)
{
    for (var index in map)
    {
        for (var bounds in map[index])
        {
            if (containsRect(map[index][bounds], x, y))
            {
                //!HACK!
                if (getContent(index))
                {
                    setCursor('pointer');
                    return;
                }
            }
        }
    }
    setCursor('default');
}

function setCursor(cursor)
{
    document.body.style.cursor = cursor;
}

window.onhashchange = function(e)
{
    var hash = window.location.hash;
    var content_id = idFromHash(hash);
    var contentDataJson = getContent(content_id);

    if (contentDataJson)
    {
        //Hash for IE back button
        window.location.hash = hash;
        setContent(contentDataJson);
    }
    else
    {
        setContent(window.index_page_json);
    }
};

function idFromHash(hash)
{
    return hash.substring(1, hash.length);
}

//var currentContentID;
//Took the variable and made it singleton in the Runtime.js file

function navigate(content_id)
{
    if (getContent(content_id))
    {
        if(Runtime.currentContentID === content_id)
        {
            return;
        }
        //TODO: Added expandTreePath Function to navigate from the content panel to the tree panel
        expandTreePath(content_id);
        Runtime.currentContentID = content_id;
        window.location.hash = content_id;
        window.onhashchange();
    }
}

function getContent(content_id)
{
    Runtime.globalContent_id = content_id;
    //Added this variable to create a link to what was the most recently clicked
    return window.content_data_json[content_id];
}

function setContent(content_data_json)
{
    var extPanel = contentPanel;
    extPanel.removeAll();

    extPanel.setTitle(createTitle(content_data_json));
    extPanel.add(createHtmlPanels(content_data_json.html_panel));
    extPanel.add(createGridPanels(content_data_json.grid_panel));
    extPanel.add(createImagePanels(content_data_json.image_panel));
}

function createTitle(content_data_json)
{
    function wrapWithDiv(text, id)
    {
        return "<div id='"+id+"'>"+text+"</div>";
    }
    if (content_data_json.path)
    {
        return wrapWithDiv(content_data_json.title, "titleLabel")+wrapWithDiv(content_data_json.path, "pathLabel");
    }
    return wrapWithDiv(content_data_json.title, "titleLabel");
}

function createGridPanel(grid_panel_json)
{
    function createDataStore(data_store_json)
    {
        return Ext.create('Ext.data.Store',
                          {
                              fields:data_store_json.fields,
                              data:data_store_json.data
                          });
    }

    function getColumnsCount(columns)
    {
        return columns.length;
    }

    function calculateTableWidth(columns)
    {
        var tableWidth = 0;
        for (var index in columns)
        {
            var columnWidth = columns[index].width;
            if (columnWidth === -1)
            {
                tableWidth += 350;
            }
            else
            {
                tableWidth += columnWidth;
            }
        }
        return tableWidth;
    }

    var grid =  Ext.create('Ext.grid.Panel',
                           {   //autoScroll: true,
                               overflowX: 'hidden',
                               //TODO: overflowX and overflow create a terrible layout.
                               //overflowX: 'scroll',
                               autoHeight: true,
                               viewConfig: {
                                  //Added maxHeight in order to fix the large padding at the end of the AV-2
                                  maxHeight: Ext.getBody().getViewSize().height - (194),
                                  autoFill: true,
                                  scrollOffset: 10,
                                  listeners: {
                                      //Trying to fix the column widths of each of the grid panels that get generated.
                                      refresh: function(dataview) {
                                          var colCount = getColumnsCount(grid_panel_json.columns);
                                          if (colCount == 3) {
                                            dataview.panel.columns[0].autoSize();
                                            dataview.panel.columns[1].setSize(400);//works on the first colum
                                          }
                                          else if(colCount == 4) {
                                            dataview.panel.columns[0].autoSize();
                                            dataview.panel.columns[1].autoSize();
                                            dataview.panel.columns[2].autoSize();
                                            dataview.panel.columns[3].autoSize();
                                          }/*
                                          else if(colCount == 5) {
                                            dataview.panel.columns[0].autoSize();
                                            dataview.panel.columns[2].setSize(574);
                                          }*/
                                      }
                                  }
                               },
                               layout: 'vbox',
                               autoRender: true,
                               autoShow: true,
                               syncRowHeight: false,
                               //autoScroll: false,
                               store: createDataStore(grid_panel_json.data_store),
                               hideHeaders: grid_panel_json.hideHeaders,
                               columns: grid_panel_json.columns,
                               allowDeselect: true,
                           });

    var gridPanelHolder = new Ext.Panel(
        {
            title: grid_panel_json.title,
            titleCollapse: true,
            //resizable: true,
            //shrinkWrap: 3,
            collapseDirection: 'top',
            collapsible: grid_panel_json.collapsible,
            layout:
            {
              type: 'vbox',
              align: 'stretch',
              //overflowY: 'auto'
            },
            style:
            {
                //marginBottom: '5px',
                //autoScroll: false,
                //overflow: 'auto',
                //overflowY: 'auto'
                //TODO: Don't need these overflow properties for scrolling.  
            },
            items:[
                grid
            ]
        });

    /*if (getColumnsCount(grid_panel_json.columns) >= 4)
    {
        //TODO: Changed this in order to get the view right.
        //grid.setWidth(1508);
        //gridPanelHolder.setHeight(grid.getStore().getRange().length * 55 + 75);

        //gridPanelHolder.setAutoScroll(true);
    }*/

    return gridPanelHolder;
}

function createGridPanels(json)
{
    var panels = new Array(json.length);
    for (var index in json)
    {
        panels[index] = createGridPanel(json[index]);
    }
    return panels;
}

function createHtmlPanels(json)
{
    var panels = new Array(json.length);
    for (var index in json)
    {
        panels[index] = createHtmlPanel(json[index]);
    }
    return panels;
}

function createHtmlPanel(json)
{
    return Ext.create('Ext.panel.Panel',
                      {
                          autoRender: true,
                          autoShow: true,
                          //autoScroll: true,
                          animCollapse: false,
                          collapseDirection: 'top',
                          collapsed: false,
                          titleCollapse: true,
                          collapsible: json.collapsible,
                          title: json.title,
                          html: json.html
                      });
}

function createContentPanel(content_panel_json)
{
    return Ext.create('Ext.panel.Panel',
                      {
                          title: createTitle(content_panel_json),
                          //flex: 1,
                          margins: '',
                          region: 'center',
                          id: 'detailPanel',
                          itemId: 'detailPanel',
                          style:
                          {
                              paddingLeft: '5px'
                          },
                          overflowY: 'auto',
                          layout:
                          {
                              align: 'stretch',
                              type: 'vbox'
                          },
                          animCollapse: true,
                          autoHeight: true,
                          items:
                              [
                                  createImagePanels(content_panel_json.image_panel),
                                  createHtmlPanels(content_panel_json.html_panel),
                                  createGridPanels(content_panel_json.grid_panel)
                              ]
                      });
}

function createImagePanels(image_panel_array_json)
{
    var panels = new Array(image_panel_array_json.length);
    for (var index in image_panel_array_json)
    {
        panels[index] = createImagePanel(image_panel_array_json[index]);
    }
    return panels;
}

function createImagePanel(image_panel_json)
{
    return Ext.create('Ext.panel.Panel',
                      {
                          autoRender: true,
                          autoShow: true,
                          //autoScroll: true,
                          //overflowY: 'auto',
                          overflowX: 'auto',
                          autoHeight: true,
                          animCollapse: false,
                          collapseDirection: 'top',
                          collapsed: false,
                          titleCollapse: true,
                          collapsible: image_panel_json.collapsible,
                          style:
                          {
                              marginBottom: '5px'
                          },
                          title: image_panel_json.title,
                          items: [
                              {
                                  xtype: 'image',
                                  flex: 1,
                                  src: image_panel_json.image,
                                  width: image_panel_json.width,
                                  height: image_panel_json.height,
                                  style:
                                  {
                                      margin: '5px'
                                  },
                                  listeners:
                                  {
                                      render: function()
                                      {
                                          this.getEl().on('click', function(e, t, eOpts)
                                          {
                                              var point = getClickPoint(e);
                                              clickOnImage(image_panel_json.map, point.x, point.y);
                                          });
                                          this.getEl().on('mousemove', function(e, t, eOpts)
                                          {
                                              var point = getClickPoint(e);
                                              moveOnImage(image_panel_json.map, point.x, point.y);
                                          });
                                      }
                                  }
                              }
                          ]
                      });
}

function getClickPoint(e)
{
    var x = (e.browserEvent.offsetX===undefined)?e.browserEvent.layerX:e.browserEvent.offsetX;
    var y = (e.browserEvent.offsetY===undefined)?e.browserEvent.layerY:e.browserEvent.offsetY;
    return {
        x : x,
        y : y
    };
}

function createTreePanel(tree_json, treePanelsHolder, navigationPanel)
{
    function createTreeStore(record)
    {
        return Ext.create('Ext.data.TreeStore', {
            root:
            {
                expanded: true,
                children: record
            },
		 handler: this.onCollapse
        });
    }

    return Ext.create('Ext.tree.Panel',
                      {
				    	
                          //id: tree_json.type,
                          //Use the var treePanelHeader and navTreeId to test which panel is being accessed  
                          title: '<img src="images/'+tree_json.type+'_icon.png" align="middle" width="32" height="32"> '+tree_json.title,
                          collapseDirection: 'left',
                          placeholderCollapseHideMode: 2,
                          titleCollapse: true,
                          store: createTreeStore(tree_json.data),
                          autoScroll: true,
                          collapsible: true,
                          animCollapse: true,
                          layout:'fit',
                          style:
                          {
                              whiteSpace: 'nowrap'
                          },
                          viewConfig: {
                              rootVisible: false
                          },
                          listeners: {
                              //Added afteritemcollapse to the tree Panel in order to collapse all children node when a node collapses.
                              afteritemcollapse: 
                              { 
                                  fn : function(node, index, item, eOpts)
                                  {
                                      if( !node.isLeaf() ) {
                                        for( i = 0; i < node.childNodes.length; i++ ) {
                                          node.collapse(deep=true);
                                          }
                                      }
                                  },
                                  scope: this
                              },
                              itemclick:
                              {
                                  fn: function(rowmodel, record, index, eOpts)
                                  {
                                      navigate(record.data.qtitle);
                                  },
                                  scope: this
                              },
                              select:
                              {
                                  fn: function(rowmodel, record, index, eOpts)
                                  {
                                      navigate(record.data.qtitle);
                                  },
                                  scope: this
                              },
                              beforecollapse: function()
                              {
                                  navigationPanel.setWidth(40);
                                  navigationPanel.maxWidth = 40;
                                  treePanelsHolder.hide();
                                  return false;
                              },
                              show: function()
                              {}
                          }
                      });
}

function createTreePanels(json, treePanelsHolder, navigationPanel)
{
    var panels = new Array(json.length);
    for (var index in json)
    {
        panels[index] = createTreePanel(json[index], treePanelsHolder, navigationPanel);
    }
    return panels;
}

function createTreePanelHolderPanel(json, navigationPanel)
{
    var treePanelHolder = Ext.create('Ext.panel.Panel',
                                     {
                                         width: 350,
                                         id: 'TreePanelHolder',
                                         itemId: 'TreePanelHolder',
                                         layout:'card',
                                         activeItem:0,
                                         autoScroll: true
                                     });

    var treePanels = createTreePanels(json, treePanelHolder, navigationPanel);
    treePanelHolder.add(treePanels);
    treePanelHolder.setVisible(true);
    return treePanelHolder;
}

function createNavigationPanel()
{
    var navigationPanel = Ext.create('Ext.panel.Panel',
                                     {
                                         region: 'west',
                                         //split: true,
                                         maxWidth: 350+40, //buttons panel size and tree panels holder size
                                         itemId: 'navigation',
                                         id: 'navigation',
                                         layout: {
                                             type: 'hbox',
                                             pack: 'start',
                                             align: 'stretch'
                                         }
                                     });
    var treePanelHolder = createTreePanelHolderPanel(window.navigation_json, navigationPanel);
    var buttonsPanel = createButtons(window.navigation_json, treePanelHolder, navigationPanel);
    navigationPanel.add(buttonsPanel);
    navigationPanel.add(treePanelHolder);
    return navigationPanel;
}

function createButtons(json, cardPanel, navigationPanel)
{
    var buttons = new Array(json.length);

    function getHandler(index)
    {
        return function (btn)
        {
            if (!cardPanel.isVisible())
            {
                navigationPanel.maxWidth = 350+40, //buttons panel size and tree panels holder size
                navigationPanel.setWidth(350+40);
                cardPanel.setVisible(true);
            }
            cardPanel.getLayout().setActiveItem(parseInt(index));
        };
    };

    for (var index in json)
    {
        buttons[index] = Ext.create(
            'Ext.Button',
            {
			id: 'button' + index,
      //added the button id i.e button0, button1...  to indicate what button is being fired
      //Need to implement a better extjs solution.
                icon : 'images/'+json[index].type+'_icon.png',
                tooltip: json[index].title,
                iconAlign: 'right',
                scale   : 'large',
                width: 40,
                height: 40,
                handler: getHandler(index)
            }
        );
    }

    return Ext.create('Ext.panel.Panel',
                      {
                          itemId: 'buttons_panel',
                          id: 'buttons_panel',
                          width: 40,
                          style:
                          {
                              backgroundColor: 'transparent;'
                          },
                          layout:
                          {
                              type: 'vbox'
                          },
                          items: buttons
                      });
}

function createSearchMenuItems()
{
    var menuItems = new Array();
    menuItems.push({
                       text: window.resource.search_panel.all_text,
                       icon: 'images/search.png',
                       qtitle: 'all'
                   });

    for (var index in window.navigation_json)
    {
        menuItems.push({
                           text: window.navigation_json[index].title,
                           icon: 'images/'+window.navigation_json[index].type+'_icon.png',
                           qtitle: window.navigation_json[index].type
                       });
    }
    return menuItems;
}

function createSearchPanel()
{
    var dataStore = Ext.create('Ext.data.Store',
                               {
                                   fields:["id", "name", "type"],
                                   data:window.search_data_json['all']
                               });
    var combobox = Ext.create('Ext.form.ComboBox',
                              {
                                  height: 35,
                                  width: 250,
                                  store: dataStore,
                                  flex: 1,
                                  queryMode: 'local',
                                  displayField: 'name',
                                  valueField: 'id',
                                  hideTrigger: true,
                                  selectOnFocus: true,
                                  triggerAction: 'all',
                                  emptyText: window.resource.search_panel.emptyText,
                                  enableKeyEvents: true,
                                  fieldStyle: 'margin: 0 0 0 0; font-size:18px;',
                                  // all of your config options
                                  listeners:{
                                      beforequery: function (record)
                                      {
                                          record.query = new RegExp(record.query, 'i');
                                          record.forceAll = true;
                                      },
                                      "select": function(combo, selection)
                                      {
                                          var post = selection[0];
                                          if (post)
                                          {
                                              navigate(post.get('id'));
								  expandTreePath(post.get('id'));
                                              combo.setValue("");
                                          }
                                      }
                                  },
                                  // Template for the dropdown menu.
                                  // Note the use of "x-boundlist-item" class,
                                  // this is required to make the items selectable.
                                  listConfig:
                                  {
                                      loadingText: 'Searching...',
                                      emptyText: 'No matching posts found.',
                                      maxHeight: 285
                                  },

                                  tpl: Ext.create('Ext.XTemplate',
                                                  '<tpl for=".">',
                                                  '<div class="x-boundlist-item"><span style="padding-top: 5px; padding-left: 5px; padding-right: 5px"><img src="images/{type}_icon.png"/ width=20></span><span style="font-size:13pt; padding: 5px;">{name}</span></div>',
                                                  '</tpl>',
                                                  {
                                                      // XTemplate configuration:
                                                      compiled: true,
                                                      // member functions:
                                                      getIcon: function(type){
                                                          return 'images/'+type+'_icon.png';
                                                      }
                                                  }
                                  ),
                                  // template for the content inside text field
                                  displayTpl: Ext.create('Ext.XTemplate',
                                                         '<tpl for=".">',
                                                         '{name}',
                                                         '</tpl>'
                                  ),
                                  renderTo: Ext.getBody()
                              });

    var menu = Ext.create('Ext.menu.Menu', {
        id: 'search_filter',
        itemId: 'search_filter',
        floating: true,
        items: createSearchMenuItems()
    });

    var icon  = Ext.create('Ext.Img', {
        src: 'images/search.png',
        width: 32,
        height: 32,
        style:
        {
            marginLeft: '5px',
            //marginRight: '5px',
            marginTop: '2px',//'10px'
            cursor:'pointer'
        },
        listeners:
        {
            render: function()
            {
                this.getEl().on('click', function(e, t, eOpts)
                {
                    menu.showAt(icon.getX(), icon.getY()+icon.getHeight()+2);
                });
            }
        }
    });

    var arrow  = Ext.create('Ext.Img', {
        src: 'images/rodykle_trikampis.png',
        width: 32,
        height: 8,
        style:
        {
            marginRight: '0px',
            marginTop: '12px',//'10px'
            padding: '0px',
            cursor:'pointer'
        },
        listeners:
        {
            render: function()
            {
                this.getEl().on('click', function(e, t, eOpts)
                {
                    menu.showAt(icon.getX(), icon.getY()+icon.getHeight()+2);
                });
            }
        }
    });

    menu.on
    (   'click',
        function(e, t, eOpts)
        {
            dataStore.removeAll();
            dataStore.add(window.search_data_json[t.qtitle]);
            combobox.emptyText = window.resource.search_panel.searchIn_text+t.text+'...';
            combobox.setValue('');
            menu.hide();
            icon.setSrc(t.icon);
        }
    );

    var searchPanel = Ext.create('Ext.panel.Panel',
                                 {
                                     width: 600,
                                     layout: "hbox",
                                     bodyStyle: 'background:transparent;',
                                     items:
                                         [
                                             icon,
                                             arrow,
                                             combobox
                                         ]
                                 });

    return Ext.create('Ext.panel.Panel',
                      {
                          columnWidth: .99,
                          layout: "hbox",
                          bodyStyle: 'background:transparent;',
                          style:
                          {
                              marginTop: '20px'
                          },
                          items:
                              [
                                  //hack to put search panel in middle
                                  {html:'', flex:1, bodyStyle: 'background:transparent;'},
                                  searchPanel,
                                  {html:'', flex:1, bodyStyle: 'background:transparent;'}
                              ]
                      });
}

function createHelpButtonPanel()
{
    var imageWidth = 20;
    var imageHeight = 20;

    var helpButtonPanel =  Ext.create('Ext.panel.Panel',
                                      {
                                          id: 'helpPanel',
                                          itemId: 'helpPanel',
                                          width: 85,
                                          layout: "hbox",
                                          bodyStyle: 'background:transparent;',
                                          autoRender: true,
                                          autoShow: true,
                                          style:
                                          {
                                              marginTop: '30px'
                                          },
                                          items:
                                              [
                                                  {
                                                      xtype: 'image',
                                                      src: 'images/home_icon.png',
                                                      width: imageWidth,
                                                      height: imageHeight,
                                                      title: window.resource.help_panel.homeText,
                                                      listeners:
                                                      {
                                                          render: function()
                                                          {
                                                              this.getEl().on('click', function(e, t, eOpts)
                                                              {
                                                                  parent.location.href = window.indexPageDir;return false;
                                                              });
                                                          }
                                                      },
                                                      style:
                                                      {
                                                          cursor: 'pointer',
                                                          backgroundColor: 'transparent;',
                                                          marginRight: '2px'
                                                      }
                                                  },
                                                  {
                                                      xtype: 'image',
                                                      src: 'images/question_icon.png',
                                                      width: imageWidth,
                                                      height: imageHeight,
                                                      title: window.resource.help_panel.helpText,
                                                      listeners:
                                                      {
                                                          render: function()
                                                          {
                                                              this.getEl().on('click', function(e, t, eOpts)
                                                              {
                                                                  showTipPanel(window.help_screen_data);
                                                              });
                                                          }
                                                      },
                                                      style:
                                                      {
                                                          cursor: 'pointer',
                                                          backgroundColor: 'transparent;'
                                                      }
                                                  }
                                              ]
                                      });
    if (showFeedbackIcon())
    {
        helpButtonPanel.add({
                                xtype: 'image',
                                src: 'images/feedback_icon.png',
                                width: imageWidth,
                                height: imageHeight,
                                title: window.resource.help_panel.feedbackText,
                                listeners:
                                {
                                    render: function()
                                    {
                                        this.getEl().on('click', function(e, t, eOpts)
                                        {
                                            if (!Ext.getCmp('feedback'))
                                            {
                                                createFeedbackPanel().showAt(90, 20);
                                            }
                                        });
                                    }
                                },
                                style:
                                {
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent;'
                                }
                            });
    }

    var commentEnabled = "";

    if(commentEnabled !== "" && commentEnabled!== "NA")
    {
        helpButtonPanel.add({
                                xtype: 'image',
                                src: 'images/mail_icon.png',
                                width: imageWidth,
                                height: imageHeight,
                                title: window.resource.help_panel.commentText,
                                listeners: {
                                    render: function ()
                                    {
                                        this.getEl().on('click', function (e, t, eOpts)
                                        {
                                            if (!Ext.getCmp('commentPanel'))
                                            {
                                                createCommentPanel().showAt(90, 20);
                                            }
                                        });
                                    }
                                },
                                style: {
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent;'
                                }
                            });
    }
    return helpButtonPanel;
}

function createCommentPanel()
{
    function getComment()
    {
        return Ext.getCmp('commentText').value;
    }

    function getSummary()
    {
        return Ext.getCmp('commentSummary').value;
    }

    function formatComment(comment)
    {
        comment = comment.substring(0, 1500);

        var formattedComment = [];
        var currentIndex = 0;

        var i = 0;

        while(currentIndex < comment.length)
        {
            formattedComment[i] = comment.substring(currentIndex, currentIndex + 249);
            currentIndex += 249;
            i++;
        }

        return formattedComment;
    }

    function createButtonsPanel()
    {
        return new Ext.Container({
                                     width: 350,
                                     layout:
                                     {
                                         type : 'hbox',
                                         pack : 'end'
                                     },
                                     style:
                                     {
                                         paddingTop: '5px'
                                     },
                                     items: [
                                         Ext.create('Ext.Button',
                                                    {
                                                        text: "Send",
                                                        tooltip: "Send",
                                                        iconAlign: 'right',
                                                        scale   : 'large',
                                                        width: 80,
                                                        height: 40,
                                                        handler: function ()
                                                        {
                                                            var summary = getSummary();
                                                            if(summary.length > 199)
                                                            {
                                                                summary = summary.substring(0, 199);
                                                            }

                                                            var comment = getComment();
                                                            if(comment.length > 255)
                                                            {
                                                                comment = formatComment(comment);
                                                            }

                                                            var result = [];
                                                            result[0] = {};
                                                            result[0].url = window.location.href;
                                                            result[0].commentSummary = summary;
                                                            result[0].contentTitle = document.getElementById('titleLabel').innerText;
                                                            result[0].comment = comment;

                                                            $.ajax({
                                                                       type: "GET",
                                                                       url: "",
                                                                       data: result[0],
                                                                       success: function()
                                                                       {
                                                                           //do nothing
                                                                       },
                                                                       dataType: "jsonp"
                                                                   });
                                                            Ext.getCmp('commentPanel').close();
                                                        }
                                                    })
                                     ]
                                 });
    }

    return Ext.create('Ext.panel.Panel',
                      {
                          title: window.resource.comment_panel.title,
                          id: 'commentPanel',
                          itemId: 'commentPanel',
                          closable: true,
                          floating: true,
                          focusOnToFront: true,
                          layout: {
                              type: 'vbox',
                              align : 'left',
                              pack  : 'start'
                          },
                          width: 380,
                          style:
                          {
                              borderColor: 'white !important',
                              backgroundColor: 'white !important',
                              padding: '15px'
                          },
                          items: [
                              {
                                  style:{
                                      paddingBottom : '5px'
                                  },
                                  html: window.resource.comment_panel.empty_div
                              },
                              {
                                  xtype: 'label',
                                  forId: 'commentPanelSubject',
                                  text: window.resource.comment_panel.subjectTitle,
                                  margin: '10 0 5 0'
                              },
                              {
                                  xtype: 'textfield',
                                  name: 'name',
                                  id: 'commentSummary',
                                  width: 350,
                                  allowBlank: true,
                                  maxLength: 200
                              },
                              {
                                  xtype: 'label',
                                  forId: 'commentPanelDescription',
                                  text: window.resource.comment_panel.descriptionTitle,
                                  margin: '0 0 5 0'
                              },
                              {
                                  xtype: 'textareafield',
                                  name: 'message',
                                  id: 'commentText',
                                  itemId: 'commentTextField',
                                  height: 100,
                                  width: 350,
                                  maxLength: 1500
                              },
                              {
                                  xtype: 'label',
                                  forId: 'commentPanelLabel',
                                  text: window.resource.comment_panel.maxCharacters,
                                  style: 'font-size: 10px; color:#157fcc;'
                              },
                              createButtonsPanel()
                          ]
                      });
}

function showFeedbackIcon()
{
    var showFeedback = false;
    ["True", "true", "TRUE", "Yes", "yes", "YES", "1"].forEach(function(entry) {
        if (window.feedback === entry)
        {
            showFeedback = true;
        }
    });
    return showFeedback;
}

//Default content pane
window.contentPanel = createContentPanel
({
  "title": "",
  "html_panel": [],
  "grid_panel": [],
  "image_panel": []
 });

Ext.override(Ext.grid.View, { enableTextSelection: true });

window.tipPanel = Ext.create('Ext.panel.Panel',
                             {
                                 id: 'tipPanel',
                                 itemId: 'tipPanel',
                                 floating: true,
                                 focusOnToFront: true,
                                 layout: "border",
                                 style:
                                 {
                                     borderColor: 'white !important',
                                     backgroundColor: 'white !important',
                                     padding: '5px'
                                 },
                                 listeners:
                                 {
                                     close: function()
                                     {
                                         window.tipPanel.hide();
                                     }
                                 }
                             });

function showTipPanel(all_tips_data)
{
    var currentTip = -1;
    var tipText = Ext.create(
        'Ext.form.Label',
        {
            flex:1,
            region:'center',
            style:
            {
                backgroundColor: 'white !important',
                borderColor: 'white !important'
            },
            bodyStyle: 'background:transparent;'
        });

    var closeButton = Ext.create(
        'Ext.Button',
        {
            scale   : 'large',
            handler: function (btn)
            {
                if (currentTip >= all_tips_data.length-1)
                {
                    tipPanel.hide();
                    Ext.util.Cookies.set('process_portal_first_load', 'loaded', new Date('5/22/2020 03:05:01 PM GMT-0600'));
                }
                else
                {
                    updateTipPanel();
                }
            }
        }
    );

    var buttonsPanel = Ext.create('Ext.panel.Panel',
                                  {
                                      region:'south',
                                      style:
                                      {
                                          backgroundColor: 'transparent;'
                                      },
                                      layout:
                                      {
                                          type: 'vbox',
                                          align: 'right'
                                      },
                                      items: closeButton
                                  });

    function updateTipPanel()
    {
        currentTip++;
        var tip_data = all_tips_data[currentTip];
        tipPanel.setWidth(tip_data.width);
        tipPanel.setHeight(tip_data.height);
        tipPanel.setTitle(tip_data.title);
        tipText.update(tip_data.html);
        closeButton.setText(currentTip >= (all_tips_data.length-1) ? window.resource.help_tip.button.close : window.resource.help_tip.button.next);
        tipPanel.showAt(tip_data.posX, tip_data.posY);
    }

    tipPanel.removeAll();
    tipPanel.add(tipText);
    tipPanel.add(buttonsPanel);

    updateTipPanel();
}

Ext.onReady(function()
            {
                if (!Ext.util.Cookies.get('process_portal_first_load'))
                {
                    //showTipPanel(window.tips_data);
                }
                var content_id = idFromHash(window.location.hash);
                if (content_id)
                {
                    navigate(content_id);
                }
                else
                {
                    setContent(window.index_page_json);
                }
            });

function createLogoPanel()
{
    var logoImage = Ext.create('Ext.Img', {
        autoRender: true,
        autoShow: true,
        src: window.resource.logo_panel.logo.src,
        height: window.resource.logo_panel.logo.height,
        width: window.resource.logo_panel.logo.width,
        style:
        {
            backgroundColor: 'transparent;',
            cursor: 'pointer'
        },
        listeners:
        {
            render: function()
            {
                this.getEl().on('click', function(e, t, eOpts)
                {
                    parent.location.href = window.indexPageDir;return false;
                });
            }
        }
    });

    return Ext.create('Ext.panel.Panel',
                      {
                          autoRender: true,
                          autoShow: true,
                          width: 500,
                          id: 'logo',
                          itemId: 'logo',
                          bodyStyle: 'background:transparent;',
                          style:
                          {
                              paddingLeft: '45px',
                              paddingTop: '5px',
                              paddingBottom: '5px',
                              textAlign: 'center'
                          },
                          layout: {
                              type: 'hbox',
                              align: 'middle'
                          },
                          items: [
                              logoImage
                          ]
                      });
}

function createHeaderPanel()
{
    return Ext.create('Ext.panel.Panel',
                      {
                          flex: 0,
                          region: 'north',
                          itemId: 'header',
                          height: 70,
                          bodyStyle: 'background:transparent;',
                          layout:
                          {
                              type: 'column'
                          },
                          items:
                              [
                                  createLogoPanel(),
                                  createSearchPanel(),
                                  createHelpButtonPanel()
                              ]
                      });
}

function createFeedbackPanel()
{
    function collectPollData(name)
    {
        for (var i=1; i<=3; i++)
        {
            var radio = Ext.getCmp(name+'_radio'+i);
            if (radio.getValue())
            {
                return radio.inputValue;
            }
        }
        return 'nothing selected';
    }

    function collectCommentData()
    {
        return Ext.getCmp('comment').value;
    }

    function constructFeedbackGetRequest()
    {
        var request = window.resource.feedback_panel.feedback_host;
        request += '?like='+collectPollData('like');
        request += '&comment='+collectCommentData();
        return request;
    }

    function createButtonsPanel()
    {
        return new Ext.Container({
                                     width: 350,
                                     layout     : {
                                         type : 'hbox',
                                         pack : 'end'
                                     },
                                     style:{
                                         paddingTop: '5px'
                                     },
                                     items: [
                                         Ext.create('Ext.Button',
                                                    {
                                                        text: "Send",
                                                        tooltip: "Send",
                                                        iconAlign: 'right',
                                                        scale   : 'large',
                                                        width: 80,
                                                        height: 40,
                                                        handler: function (){
                                                            Ext.getCmp('feedback').update('<img src=\"'+constructFeedbackGetRequest()+'\"/>');
                                                            Ext.getCmp('feedback').close();
                                                        }
                                                    })
                                     ]
                                 });
    }

    function createSmilePanel(name)
    {
        return Ext.create('Ext.form.Panel', {
            width      : 400,

            items: [
                {
                    xtype      : 'fieldcontainer',
                    defaultType: 'radiofield',
                    defaults: {
                        flex: 1
                    },
                    layout: 'column',
                    items: [{
                                columnWidth: .33,
                                boxLabel  : '<img src="images/smiles/smiley.png" width=40px height=40px style="background-color: #157fcc;">',
                                name      : name,
                                inputValue: 'yes',
                                id        : name+'_radio3'
                            }, {
                                columnWidth: .33,
                                boxLabel  : '<img src="images/smiles/neutral.png" width=40px height=40px style="background-color: #157fcc;">',
                                name      : name,
                                inputValue: 'maybe',
                                id        : name+'_radio2'
                            },{
                                columnWidth: .33,
                                boxLabel  : '<img src="images/smiles/sad.png" width=40px height=40px style="background-color: #157fcc;">',
                                name      : name,
                                inputValue: 'no',
                                id        : name+'_radio1'
                            }]
                }
            ]
        });
    }

    return Ext.create('Ext.panel.Panel',
                      {
                          title: window.resource.feedback_panel.title,
                          id: 'feedback',
                          itemId: 'feedback',
                          closable: true,
                          floating: true,
                          focusOnToFront: true,
                          layout: {
                              type: 'vbox',
                              align : 'left',
                              pack  : 'start'
                          },
                          width: 380,
                          style:
                          {
                              borderColor: 'white !important',
                              backgroundColor: 'white !important',
                              padding: '15px'
                          },
                          items: [
                              createSmilePanel("like"),
                              {
                                  style:{
                                      paddingBottom : '5px'
                                  },
                                  html: window.resource.feedback_panel.comment_text
                              },
                              {
                                  xtype     : 'textareafield',
                                  name      : 'message',
                                  id        : 'comment',
                                  itemId    : 'comment',
                                  height: 100,
                                  width: 350
                              },
                              {
                                  style:{
                                      paddingTop : '5px'
                                  },
                                  html: window.resource.feedback_panel.bottom_bar
                              },
                              createButtonsPanel()
                          ]
                      });
}

Ext.define('CustomsReport.view.MyViewport', {
    extend: 'Ext.container.Viewport',

    layout: {
        type: 'border'
    },
    listeners: {
        add: function (c, i) {
            if (i.xtype === 'bordersplitter')
            {
                i.performCollapse = false;
                i.width = 2;
            }
        }
    },
    initComponent: function() {
        var me = this;

        Ext.applyIf(me, {
            items:
                [
                    window.contentPanel,
                    createNavigationPanel(),
                    createHeaderPanel()
                ]
        });
        me.callParent(arguments);
    }
});
