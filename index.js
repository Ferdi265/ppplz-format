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
		beatmapName = function (beatmap) {
			return color(beatmap.artist + ' - ' + beatmap.title, 3) + color(' [' + beatmap.version + ']', 1);
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
		padleft = function (num, digits) {
			return Array(digits -num.toFixed(0).length + 1).join('0') + String(num);
		},
		time = function () {
			var now = new Date();
			return color('[' + padleft(now.getHours(), 2) + ':' + padleft(now.getMinutes(), 2) + ']', 6);
		},
		formatRecent = function (score, line) {
			osu.getBeatmap(score.beatmap_id, function (err, beatmap) {
				var msg;
				if (err) {
					line(time() + ' ' + color('' + err, 1));
					return;
				}
				if (score.rank === 'F') {
					msg = color('Failed ', 1) + beatmapName(beatmap);
				} else {
					msg = color('Achieved rank ', 7) + colorRank(score.rank) + color(' on ', 7) + beatmapName(beatmap);
				}
				if (score.pb) {
					msg = color('New PB! ', 2) + msg;
				}
				line(time() + ' ' + msg);
				formatScore(score, line);
			});
		},
		formatScore = function (score, line) {
			var elements = [];
			if (score.pb) {
				elements.push(color('PP: ', 3) + color(score.pp.toFixed(2), 7));
			}
			elements.push(color('Accuracy: ', 3) + color(score.accuracy.toFixed(2) + '%', 7));
			if (elements.length > 0) {
				line.call(undefined, time() + ' ' + elements.join(', '));
			}
		},
		formatUser = function (user, line) {
			var msg = '';
			if (user.relative_pp < 0) {
				msg += color('Lost PP: ', 1) + color((user.relative_pp * -1).toFixed(2) + ', ', 7);
			} else {
				msg += color('Gained PP: ', 2) + color(user.relative_pp.toFixed(2) + ', ', 7);
			}
			msg += color('Total PP: ', 3) + color(user.pp.toFixed(2) + ', ', 7);
			if (user.relative_rank < 0) {
				msg += color('Relative Rank: ', 3) + color(user.relative_rank, 2) + color(', ', 7);
			} else {
				msg += color('Relative Rank: ', 3) + color('+' + user.relative_rank, 1) + color(', ', 7);
			}
			msg += color('Rank: ', 3) + color(user.rank, 7);
			line(time() + ' ' + msg);
		},
		osu = ppplz.osu;
	if (cb === undefined) {
		cb = options;
		options = {};
	}
	return {
		score: function (err, score) {
			if (err) {
				cb(time() + ' ' + color('' + err, 1));
			} else {
				formatRecent(score, cb);
			}
		},
		watch: function (err, result) {
			if (err) {
				cb(time() + ' ' + color(err + '', 1));
				return;
			}
			formatUser(result.user, cb);
			formatRecent(result.score, cb);
		}
	};
};