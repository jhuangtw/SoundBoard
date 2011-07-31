Ext.setup({
    icon: 'icon.png',
    glossOnIcon: false,
    onReady: function() {
        
        var feedstylepanel = new Ext.Component({
            title: 'Feed',
            scroll: 'vertical',
            cls: 'sbentry',
            tpl: [
                '<tpl for=".">',
                    '<div class="song">',
                            '<div class="avatar"><img src="{user.avatar_url}" /></div>',
                            '<div class="song-info">',
                                '<h2>{timestamp}</h2>',
                                '<p>commenter [{user.username}]</p>',
                            '</div>',
                    '</div>',
                '</tpl>'
            ]
        });
        
        var soundboard = new Ext.Panel({
        	title: 'Soundboard',
        	
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
        });
        
        var panel = new Ext.TabPanel({
            fullscreen: true,
            cardSwitchAnimation: 'slide',
            items: [soundboard,feedstylepanel]
        });

        function playHandler(i, track_id, timestamp) {
        	return function() {
        		console.log('btn info: ' + track_id + ': ' + timestamp);
        		var player;
        		if (i % 2 == 0) {
        			player = soundcloud.getPlayer('scPlayer');
        		} else {
        			player = soundcloud.getPlayer('scPlayer1');
        		}
        		
        		// FIXME artifact on stop?
        		player.api_seekTo(timestamp);
        		player.api_toggle();
        	}
        }

        var handleSCComment = function(results) {        	
        	var existing_commenter = {};
        	var to_update = new Array();
        	var buttons = new Array();
        	
        	for (i=0; i<results.length; i++) {
        		if (existing_commenter[results[i].user.username] != true) {
        			existing_commenter[results[i].user.username] = true;
        			to_update.push(results[i]);
        			buttons.push({
        					text: results[i].user.username,
        					icon: results[i].user.avatar_url,	// FIXME too small?
        					handler: playHandler(i, results[i].track_id,
        									     results[i].timestamp/1000)
        			});
        		}
        	}
        	
        	feedstylepanel.update(to_update);
        	soundboard.add(
        		{items: buttons.splice(0,3)},
        		{items: buttons.splice(3,3)},
        		{items: buttons.splice(6,3)});
        	soundboard.doLayout();
        }
        
        var pullstufffromsoundcloud = function() {
        	SC.initialize({
        		client_id: "f308155317f2372c0eb4ec31f9329073"
        	});
        	
        	var player = soundcloud.getPlayer('scPlayer');
        	player.api_load("http://api.soundcloud.com/tracks/17861573");
        	
        	var player = soundcloud.getPlayer('scPlayer1');
        	player.api_load("http://api.soundcloud.com/tracks/17861573");
        	
        	SC.get("/tracks/17861573/comments.json", handleSCComment);
        }

        var tabBar = panel.getTabBar();
        
        tabBar.addDocked({
            xtype: 'button',
            ui: 'mask',
            iconCls: 'refresh',
            dock: 'right',
            stretch: false,
            align: 'center',
            handler: pullstufffromsoundcloud
        });
    }
});
