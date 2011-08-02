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
    launch: function () {
    	Ext.regModel('SongInfo', {
    			fields: [
    				{ name: 'songurl', type: 'url' }
    			],
    			validations: [
    				{ type: 'presence', field: 'songurl', message: 'please enter url'}
    			]
    	});
    	
    	soundcloud.addEventListener('onPlayerReady', function(player, data) {
    			// argh ... hack to preload somehow??
	 		});
	 		soundcloud.addEventListener('onMediaDoneBuffering', function(player, data) {
	 		});
	 		
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
    	
    	var genPlayHandler = function(i, track_id, timestamp) {
        	return function() {
        		var player = soundcloud.getPlayer('tmpScPlayer'+i);
        		
        		// FIXME artifact on stop?
        		player.api_seekTo(timestamp);
        		player.api_toggle();
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
										text: results[i].user.username,
										icon: results[i].user.avatar_url,	// FIXME too small?
										handler: genPlayHandler(i, results[i].track_id,
																 results[i].timestamp/1000)
							});
							// FIXME only support 6 pads for now
							if (i==5) break;
						}
						// FIXME: HACK
						pads_panel.add(
							{items: buttons.slice(0,3)},
							{items: buttons.slice(3,6)},
							{items: buttons.slice(6,9)});
						
						for (i=0; i<buttons.length; i++) {
							pads_panel.add({
										html: generateSCPlayerHtmlCode(0, 'tmpScPlayer'+i, 'http://api.soundcloud.com/tracks/' + omg_global_songid),
										// hidden: true // FIXME
							});
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
    				value: 'http://soundcloud.com/basisdubstep/basis-nujabes' 
    			},
    		 	{
    		 		xtype: 'button',
    		 		text: 'Preview',
    		 		width: '20%',
    		 		handler: function() {
    		 			var songPickerForm = SampleCloudApp.views.songPickerForm;
    		 			songurl = songPickerForm.getValues()['songurl'];
    		 			
    		 			SC.initialize({client_id: mySoundCloudApiKey});
    		 			SC.get("/resolve.json?url=" + songurl, function(results) {
    		 					omg_global_songid = results.id;
    		 					
    		 					var songPickerForm = SampleCloudApp.views.songPickerForm;
    		 					songPickerForm.add({
    		 						html: generateSCPlayerHtmlCode(81, 'previewPlayer', results.permalink_url)
    		 					});
    		 					songPickerForm.add({
    		 						xtype: 'textfield',
    		 						label: 'number of comments',
    		 						value: results.comment_count
    		 					});
    		 					songPickerForm.add({
    		 						xtype: 'button',
										text: 'Go!',
										width: '20%',
										handler: function () {
											setUpCommentsPadsScreen();
											SampleCloudApp.views.viewport.setActiveItem(
												'commentPads', {type: 'slide', direction: 'left'});
										}
    		 					});
    		 					songPickerForm.doLayout();
    		 					
    		 					// TODO: only enable if input validation was successful
    		 					SampleCloudApp.views.songPickerFormBottomDock.getComponent('done_b').enable();
    		 			});
    		 			
    		 		}
    		 	},
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
					// FIXME html: 'This is where you press buttonzzz',
					        	
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
