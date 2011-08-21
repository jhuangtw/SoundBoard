/*
TODOs:
- customized buttons (larger profile pic, on/off state)
- onUp/onDown triggers for buttons for more precise control?
- custom gridview
- validate input etc

consider <audio style="width:100%; height:15px" src="http://media.soundcloud.com/stream/rYl37zjX02TL?url=http%3A//api.soundcloud.com/tracks/2197494" controls preload="all">
but doesn't seek?
*/

var App = new Ext.Application({
    name: 'SampleCloudApp',
    useLoadMask: true,
    fullscreen: true,
    autoInitViewport: false,
    launch: function () {
    	this.launched = true;
    	// launch main app after soundManager is ready to go.
    	// TODO: handle any error here? in case soundManager fails to init
    	soundManager.onready(function() {
    			soundManager.defaultOptions.autoLoad = true;
    			App.mainLaunch();
			});
			
      //this.mainLaunch();
    },
    mainLaunch: function() {    	
	 		var mySoundCloudApiKey = 'f308155317f2372c0eb4ec31f9329073';
    	
    	var generateSCPlayerHtmlCode = function(height, playerid, url) {
    		// FIXME: smarter sprintf??
    		var flashurl = 'http://player.soundcloud.com/player.swf?url=' + url + '&enable_api=true&single_active=false&object_id=' + playerid;
    		
    		return '<object height="' + height + '" width="100%" id="' + playerid + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
    		 			 '<param name="movie" value="' + flashurl + '"></param>' +
    		 			 '<param name="allowscriptaccess" value="always"></param>' +
    		 			 '<embed allowscriptaccess="always" height="' + height + '" src="' + flashurl + '" type="application/x-shockwave-flash" width="100%" name="' + playerid + '"></embed>' +
    		 			 '</object>';
    	}
    	
    	var omg_global_songid = -1;
    	var sm_players = new Array();
    	
    	var genPlayHandler = function(i, track_id, timestamp) {
        	return function() {
        		var p = sm_players[i]; 
        		p.setPosition(timestamp);
        		p.onposition(timestamp + 500, function() { p.stop(); });
        		p.play();
        	}
      }

      var setUpCommentsPadsScreen = function() {
      	// FIXME: populate the view etc
				SC.get("/tracks/" + omg_global_songid + "/comments.json", function(results) {
						var pads_panel = SampleCloudApp.views.commentPads;
						pads_panel.removeAll();
						
						var buttons = new Array();
						
						// TODO: de-dup based on timestamp or user?
						for (i=0; i<results.length; i++) {
							buttons.push({
									  id: 'pad'+i,
										text: results[i].user.username,
										icon: results[i].user.avatar_url,	// FIXME too small?
										// FIXME disabled: true,
										handler: genPlayHandler(i, results[i].track_id,
																 results[i].timestamp)
							});
							// FIXME only support 6 pads for now
							if (i==5) break;
						}
						// FIXME: HACK
						pads_panel.add(
							{items: buttons.slice(0,3)},
							{items: buttons.slice(3,6)},
							{items: buttons.slice(6,9)});
						
						// FIXME: also have a way to garbage collect these
						for (i=0; i<buttons.length; i++) {
							var sp = soundManager.createSound({
												id: 'tmpSmPlayer' + i,
												url: 'http://api.soundcloud.com/tracks/' + omg_global_songid + '/stream?client_id='+mySoundCloudApiKey,
												autoPlay: false,
												volume: 70,
												// FIXME onload: function() { console.log(SampleCloudApp.views.commentPads.getComponent('pad'+i)); SampleCloudApp.views.commentPads.getComponent('pad'+i).enable(); }
							});
							sp.load();
							sm_players.push(sp);
						}
						
						pads_panel.doLayout();
				});
      }
      
    	SampleCloudApp.views.songPickerFormBottomDock = new Ext.Toolbar({
			dock: 'bottom',
			items: [
				{ xtype: 'spacer' },
				{
					id: 'done_b',
					text: 'Next',
					ui: 'action',
					disabled: true,
					handler: function () {
						setUpCommentsPadsScreen();
						SampleCloudApp.views.viewport.setActiveItem(
							'commentPads', {type: 'slide', direction: 'left'});
					}
				}
			]
    	});
    	
    	SampleCloudApp.views.songPickerForm = new Ext.form.FormPanel({
    		id: 'songPickerForm',
    		items: [
    			{
    				xtype: 'urlfield',
    				name: 'songurl',
    				label: 'Soundcloud URL',
    				value: 'http://soundcloud.com/wick-it/austin-powers-vs-big-k-r-i-t' 
    			},
    		 	{
    		 		xtype: 'button',
    		 		text: 'Preview',
    		 		width: '20%',
    		 		handler: function() {
    		 			var songPickerForm = SampleCloudApp.views.songPickerForm;
    		 			var songurl = songPickerForm.getValues()['songurl'];
    		 			
    		 			SC.initialize({client_id: mySoundCloudApiKey});
    		 			SC.get("/resolve.json?url=" + songurl, function(results) {
    		 					omg_global_songid = results.id;
    		 					var can_be_padified = !(results.comment_count < 2);
    		 					songPickerForm.getComponent('formPlayer').setVisible(true).update(generateSCPlayerHtmlCode(81, 'previewPlayer', results.permalink_url));
    		 					songPickerForm.getComponent('formNumComments').setVisible(true).setValue(results.comment_count);
    		 					songPickerForm.getComponent('formCanStream').setVisible(true).setValue(results.streamable);
    		 					songPickerForm.getComponent('formGo').setVisible(can_be_padified);
    		 					songPickerForm.doLayout();
    		 					
    		 					if (!can_be_padified) {
    		 						Ext.Msg.alert('too few comments :(', 'please try a song with more comments', Ext.emptyFn);
    		 						SampleCloudApp.views.songPickerFormBottomDock.getComponent('done_b').disable();
    		 					} else {
    		 						SampleCloudApp.views.songPickerFormBottomDock.getComponent('done_b').enable();
    		 					}
    		 			});  // resolve callback
    		 		}  // button handler function
    		 	},
    		 	
    		 	{
    		 		id: 'formPlayer',
    		 		xtype: 'component',
    		 		hidden: true
    		 	},
    		 	{
						 id: 'formNumComments',
				  xtype: 'textfield',
					label: 'number of comments',
					hidden: true
    		 	},
    		 	{
						 id: 'formCanStream',
					xtype: 'textfield',
					label: 'can stream',
					hidden: true
    		 	},
    		 	{
						 id: 'formGo',
					xtype: 'button',
					 text: 'Go!',
					width: '20%',
					handler: function () {
						setUpCommentsPadsScreen();
						SampleCloudApp.views.viewport.setActiveItem(
							'commentPads', {type: 'slide', direction: 'left'});
						},
					hidden: true
					}
    		],
    		dockedItems: [SampleCloudApp.views.songPickerFormBottomDock]
    	});
    	
    	SampleCloudApp.views.commentPadsBottomDock = new Ext.Toolbar({
			dock: 'bottom',
			items: [
				{ xtype: 'spacer' },
				{
					text: 'Back',
					ui: 'action',
					handler: function () {
						SampleCloudApp.views.viewport.setActiveItem(
							'songPickerForm', {type: 'slide', direction: 'right'});
					}
				}
			]
    	});
    	
			SampleCloudApp.views.commentPads = new Ext.Panel({
					id : 'commentPads',
        	layout: {
        		type : 'vbox',
        		pack : 'center',
        		align: 'stretch'
        	},
        	
        	defaults: {
        		layout: {
        			type: 'hbox',
        		},
        		flex: 1,
        		defaults: {
        			xtype: 'button',
        			flex: 1,
        			margin: 10
        		}
        	},
					dockedItems: [SampleCloudApp.views.commentPadsBottomDock]
			});

			SampleCloudApp.views.viewport = new Ext.Panel({
					fullscreen : true,
					layout : 'card',
					cardAnimation : 'slide',
					items: [
						SampleCloudApp.views.songPickerForm,
						SampleCloudApp.views.commentPads
					]
			});
    }
})
