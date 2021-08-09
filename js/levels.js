// -------------------------- CREATING LEVEL 1 -------------------------- //
// levelName, numColumns, numRows, spawnX, spawnY
level1 = new Level('level 1: zombie land national park', 100, 50, 5, 39);

//tile insertion parameters: x, y, amt, type, moving, moveDistance (if moving)
//floor 1
level1.horizontalInsert(0, 49, 21, 'grass', false);
//wall 1
level1.verticalInsert(21, 30, 20, 'grass', false);
level1.verticalInsert(22, 30, 20, 'grass', false);
level1.verticalInsert(23, 31, 5, 'grass', false);
level1.verticalInsert(24, 31, 5, 'grass', false);
level1.verticalInsert(25, 31, 4, 'grass', false);
level1.verticalInsert(26, 31, 4, 'grass', false);
level1.verticalInsert(27, 31, 3, 'grass', false);
//ladder platform
level1.horizontalInsert(10, 38, 3, 'grass', false);
level1.verticalInsert(11, 27, 11, 'ladder', false);
level1.horizontalInsert(10, 26, 3, 'grass', false);
//floor 2
level1.horizontalInsert(0, 30, 10, 'grass', false);
level1.horizontalInsert(13, 30, 15, 'grass', false);
//moving platform 1
level1.horizontalInsert(0, 25, 2, 'grass', true, 5);
//moving platform 2
level1.horizontalInsert(8, 21, 2, 'grass', true, 5);
//moving platform 3
level1.horizontalInsert(0, 17, 2, 'grass', true, 5);
//moving platform 4
level1.horizontalInsert(8, 13, 2, 'grass', true, 5);
//moving platform 5
level1.horizontalInsert(13, 9, 5, 'grass', true, 5);
//platform after floppits
level1.horizontalInsert(53, 13, 11, 'grass', false);

//middle moving platform
level1.horizontalInsert(28, 25, 8, 'grass', true, 5);
//middle moving platform 2
level1.horizontalInsert(43, 30, 4, 'grass', true, 5);
//middle moving platform 3
level1.horizontalInsert(38, 35, 4, 'grass', true, 5);
//middle moving platform 3
level1.horizontalInsert(33, 40, 4, 'grass', true, 5);

//key platform
level1.horizontalInsert(23, 43, 5, 'grass', false);

//right moving platform 1
level1.horizontalInsert(53, 25, 8, 'grass', true, 5);
//right platforms
level1.horizontalInsert(68, 25, 5, 'grass', false);
level1.horizontalInsert(76, 21, 5, 'grass', false);
level1.horizontalInsert(84, 17, 5, 'grass', false);
//right wall
level1.verticalInsert(93, 7, 10, 'grass', false);
level1.verticalInsert(94, 7, 10, 'grass', false);
//door platform
level1.horizontalInsert()

level1.setCurrentLevel();



//  --------------------------------- LEVEL 2 ---------------------------------- //
//level, numColumns, numRows, spawnX, spawnY
level2 = new Level('uncreated level :(', 50, 50, 5, 46);

//tile insertion parameters: x, y, amt, type, moving, moveDistance (if moving)
//floor 1
level2.horizontalInsert(0, 49, 21, 'grass', false);
//level2.setCurrentLevel();

var levelArray = [level1, level2];





