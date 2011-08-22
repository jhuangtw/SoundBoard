/*
TODOs:
- customized buttons (larger profile pic, on/off state)
- onUp/onDown triggers for buttons for more precise playback length control?
- custom gridview
*/

var App = new Ext.Application({
    name: 'SampleCloudApp',
    useLoadMask: true,
    fullscreen: true,
    autoInitViewport: false,
    launch: function () {
    	this.launched = true;
    	
    	soundManager.ontimeout(function() {
    			Ext.Msg.alert('aw snap ...', 'looks like flash died :( try reloading the browser', Ext.emptyFn);
			});
    	soundManager.onready(function() {
    			soundManager.defaultOptions.autoLoad = true;
    			App.mainLaunch();
			});
    },
    mainLaunch: function() {    	
	 		var mySoundCloudApiKey = 'f308155317f2372c0eb4ec31f9329073';
	 		var omg_global_songid = -1;
    	var sm_players = new Array();
	 		
	 		Ext.regModel('Comment', {
				fields: [
					{name: 'user',        type: 'string'},
					{name: 'comment', 		type: 'string'},
					{name: 'timestamp',   type: 'integer'},
					{name: 'thumb_url',   type: 'string'}
				]
			});
			
			var CommentsStore = new Ext.data.Store({
					model: 'Comment',
					proxy: {
							type: 'sessionstorage',
							id: 'shoppingCart'
					}
			});
			
			/*  deprecated ...
			SampleCloudApp.views.commentsListView = new Ext.DataView({
					store: CommentsStore,
					tpl: new Ext.XTemplate(
							'<tpl for=".">',
									'<div class="comment-user" id="{user}">',
											'<img src="{thumb_url}" />',
											'<div class="button">{comment}</div>',
									'</div>',
							'</tpl>'
					),
					itemSelector:'div.comment-user',
					emptyText: 'No comment to display'
			});
			*/
    	
    	var generateSCPlayerHtmlCode = function(height, playerid, url) {
    		var flashurl = 'http://player.soundcloud.com/player.swf?url=' + url +
    				'&enable_api=true&single_active=false&object_id=' + playerid;
    		
    		return '<object height="' + height + '" width="100%" id="' + playerid + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000">' +
    		 			 '<param name="movie" value="' + flashurl + '"></param>' +
    		 			 '<param name="allowscriptaccess" value="always"></param>' +
    		 			 '<embed allowscriptaccess="always" height="' + height + '" src="' + flashurl + '" type="application/x-shockwave-flash" width="100%" name="' + playerid + '"></embed>' +
    		 			 '</object>';
    	}
    	
    	var genPlayHandler = function(i, track_id, timestamp) {
        	return function() {
        		var p = sm_players[i]; 
        		p.setPosition(timestamp);
        		p.onposition(timestamp + 600, function() { p.stop(); });
        		p.play();
        	}
      }
      
      var loadingNotification = new Ext.ActionSheet({
				items: [{
						text: 'Loading, please wait ...',
						handler: function() {
							loadingNotification.hide();
						}
				}]
			});
      
      var genSMDoneLoading = function(i) {
        	return function() {
        		SampleCloudApp.views.commentPads.items.items[Math.floor(i/3)].items.items[i%3].enable();
        		loadingNotification.hide();
        	}
      }
      
      var setUpCommentsPadsScreen = function() {
      	for (i=0; i<sm_players.length; i++) {
					sm_players[i].destruct();
				}
				sm_players.length = 0;
      	
				SC.get("/tracks/" + omg_global_songid + "/comments.json", function(results) {
						var pads_panel = SampleCloudApp.views.commentPads;
						pads_panel.removeAll();
						
						var buttons = new Array();

						var cnt = 0;
						// FIXME only supports up to 9 pads for now
						while (results.length > 0 && cnt < 9) {
							var i = Math.floor(Math.random() * results.length);
							var timestamp = results[i].timestamp;
							buttons.push({
									  id: 'pad'+cnt,
										text: results[i].user.username + '<br/>@ ' + Math.floor(timestamp/1000/60) + ':' + Math.floor(timestamp/1000%60),
										icon: results[i].user.avatar_url,
										iconAlign: 'top',
										disabled: true,
										width: 100,
										height: 100,
										handler: genPlayHandler(cnt, results[i].track_id, timestamp),
							});
							results.splice(i, 1);
							cnt++;
						}
						
						pads_panel.add(
							{items: buttons.slice(0,3)},
							{items: buttons.slice(3,6)},
							{items: buttons.slice(6,9)});
						
						for (i=0; i<buttons.length; i++) {
							var sp = soundManager.createSound({
												id: 'tmpSmPlayer' + i,
												url: 'http://api.soundcloud.com/tracks/' + omg_global_songid + '/stream?client_id='+mySoundCloudApiKey,
												autoPlay: false,
												volume: 70,
												onload: genSMDoneLoading(i)
							});
							sp.load();
							sm_players.push(sp);
						}
						
						pads_panel.doLayout();
						loadingNotification.show();
				});
      }
      
    	SampleCloudApp.views.songPickerFormBottomDock = new Ext.Toolbar({
			dock: 'bottom',
			items: [
				{ xtype: 'spacer' },
				{
					id: 'done_b',
					text: 'Next',
					ui: 'forward',
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
    				label: 'soundcloud URL',
    				value: 'http://soundcloud.com/wick-it/austin-powers-vs-big-k-r-i-t' 
    			},
    		 	{
    		 		xtype: 'button',
    		 		text: 'preview',
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
					 text: 'hit me!',
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
				{
					text: 'Randomize',
					ui: 'action',
					handler: function () {
						setUpCommentsPadsScreen();
					}
				},
				{ xtype: 'spacer' },
				{
					text: 'Back',
					ui: 'back',
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
