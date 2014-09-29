var //Requires
	Color = require('colorful').Color;

module.exports = function (ppplz, options, cb) {
	var color = function (string, fg, bg) {
			if (!options.color) return string;
			var c = new Color(string);
			c.fgcolor = fg === undefined ? null : fg;
			c.bgcolor = bg === undefined ? null : bg;
			return '' + c;
		},
		beatmapName = function (beatmap, score) {
			var name = color(beatmap.artist + ' - ' + beatmap.title, 3) + color(' [' + beatmap.version + ']', 1),
				selected = parseInt(score.enabled_mods),
				modStr = '',
				modStrPart;
			if (selected & ppplz.Mods.Hidden || selected & ppplz.Mods.HardRock || selected & ppplz.Mods.DoubleTime || selected & ppplz.Mods.NightCore || selected & ppplz.Mods.SuddenDeath || selected & ppplz.Mods.Perfect || selected & ppplz.Mods.FlashLight || selected & ppplz.Mods.FadeIn) {
				modStrPart = '+';
				if (selected & ppplz.Mods.Hidden) modStrPart += 'HD';
				if (selected & ppplz.Mods.HardRock) modStrPart += 'HR';
				if (selected & ppplz.Mods.NightCore) {
					modStrPart += 'NC';
				} else if (selected & ppplz.Mods.DoubleTime) {
					modStrPart += 'DT';
				}
				if (selected & ppplz.Mods.Perfect) {
					modStrPart += 'PF';
				} else if (selected & ppplz.Mods.SuddenDeath) {
					modStrPart += 'SD';
				}
				if (selected & ppplz.Mods.FlashLight) modStrPart += 'FL';
				if (selected & ppplz.Mods.FadeIn) modStrPart += 'FI';
				modStr += color(modStrPart, 2);
			}
			if (selected & ppplz.Mods.Easy || selected & ppplz.Mods.NoFail || selected & ppplz.Mods.HalfTime || selected & ppplz.Mods.SpunOut || selected & ppplz.Mods.Key4 ||selected & ppplz.Mods.Key5 || selected & ppplz.Mods.Key6 || selected & ppplz.Mods.Key7 || selected & ppplz.Mods.Key8) {
				modStrPart = '-';
				if (selected & ppplz.Mods.Easy) modStrPart += 'EZ';
				if (selected & ppplz.Mods.NoFail) modStrPart += 'NF';
				if (selected & ppplz.Mods.HalfTime) modStrPart += 'HT';
				if (selected & ppplz.Mods.SpunOut) modStrPart += 'SO';
				if (selected & ppplz.Mods.Key4) modStrPart += 'K4';
				if (selected & ppplz.Mods.Key5) modStrPart += 'K5';
				if (selected & ppplz.Mods.Key6) modStrPart += 'K6';
				if (selected & ppplz.Mods.Key7) modStrPart += 'K7';
				if (selected & ppplz.Mods.Key8) modStrPart += 'K8';
				modStr += color(modStrPart, 1);
			}
			name = name + modStr;
			if (options.link) {
				name = '[http://osu.ppy.sh/b/' + beatmap.beatmap_id + ' ' + name + ']';
			}
			return name;
		},
		colorRank = function (rank) {
			switch (rank) {
				case 'F':
				case 'D':
					return color(rank, 1);
				case 'C':
					return color(rank, 5);
				case 'B':
					return color(rank, 4);
				case 'A':
					return color(rank, 2);
				case 'S':
				case 'SH':
				case 'X':
				case 'XH':
					return color(rank, 3);
				default:
					return color(rank, 7);
			}
		},
		retry = function (amount, fn, thisArg) {
			var args = Array.prototype.slice.call(arguments, 3),
				counter = 0;
			return function (cb) {
				args.push(function (err, res) {
					if (err) {
						if (++counter >= amount) {
							cb(err, res);
						} else {
							fn.apply(thisArg, args);
						}
					} else {
						cb(err, res);
					}
				});
				fn.apply(thisArg, args);
			};
		},
		formatRecent = function (score, line) {
			retry(3, osu.getBeatmap, osu, score.beatmap_id)(function (err, beatmap) {
				var msg;
				if (err) {
					line(color('' + err, 1));
					return;
				}
				if (score.rank === 'F') {
					msg = color('Failed ', 1) + beatmapName(beatmap, score);
				} else {
					msg = color('Achieved rank ', 7) + colorRank(score.rank) + color(' on ', 7) + beatmapName(beatmap, score);
				}
				if (score.pb) {
					msg = color('New PB! ', 2) + msg;
				}
				line(msg);
				formatScore(score, line);
			});
		},
		formatScore = function (score, line) {
			var elements = [];
			if (score.pb) {
				elements.push(color('Raw PP: ', 3) + color(score.pp_raw.toFixed(2), 7));
				if (score.pp_weighted) elements.push(color('Weighted PP: ', 3) + color(score.pp_weighted.toFixed(2), 7));
			}
			elements.push(color('Accuracy: ', 3) + color(score.accuracy.toFixed(2) + '%', 7));
			if (elements.length > 0) {
				line.call(undefined, elements.join(', '));
			}
		},
		formatUser = function (user, line) {
			var msg = '';
			if (user.relative) {
				if (user.relative_pp < 0) {
					msg += color('Lost PP: ', 1) + color((user.relative_pp * -1).toFixed(2) + ', ', 7);
				} else {
					msg += color('Gained PP: ', 2) + color(user.relative_pp.toFixed(2) + ', ', 7);
				}
			}
			msg += color('Total PP: ', 3) + color(user.pp.toFixed(2) + ', ', 7);
			if (user.relative) {
				if (user.relative_rank < 0) {
					msg += color('Relative Rank: ', 3) + color(user.relative_rank, 2) + color(', ', 7);
				} else {
					msg += color('Relative Rank: ', 3) + color('+' + user.relative_rank, 1) + color(', ', 7);
				}
			}
			msg += color('Rank: ', 3) + color(user.rank, 7);
			line(msg);
		},
		select = function (score) {
			return score && (score.rank !== 'F' || options.filter === 'tries') && (options.filter !== 'pbs' || score.pb);
		},
		osu = ppplz.osu;
	if (cb === undefined) {
		cb = options;
		options = {};
	}
	return function (err, result) {
		if (err) {
			cb(color('' + err, 1));
		} else if (result && select(result.score)) {
			formatUser(result.user, cb);
			formatRecent(result.score, cb);
		} else if (result) {
			cb(color('You don\'t have any recent scores.', 7));
		}
	};
};