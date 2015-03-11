{
    init: function(elevators, floors) {
        var numFloors = floors.length;
        var numElevators = elevators.length;

        function SetupElevator(elevator) {
            elevator.floorPressed = new Array(numFloors);
            for (var i = 0; i < numFloors; i++) {
                elevator.floorPressed[i] = false;
            }

            elevator.currentDir = 0;
        }

        function SetupElevatorDirection(elevator, dir) {
            elevator.destinationQueue.length = 0;
            if (dir != 0) {
                for (var i = elevator.currentFloor() + dir; i >= 0 && i < numFloors; i += dir) {
                    if (elevator.floorPressed[i])
                        elevator.destinationQueue.push(i);
                }
            }
            elevator.checkDestinationQueue();

            elevator.currentDir = dir;
            elevator.goingUpIndicator(dir == 1 || dir == 0);
            elevator.goingDownIndicator(dir == -1 || dir == 0);
        }

        function SetupElevatorDestinations(elevator) {
            var currentFloor = elevator.currentFloor();
            var hasUp = false, hasDown = false;
            for (var i = currentFloor + 1; i < numFloors; ++i) {
                if (elevator.floorPressed[i]) {
                    hasUp = true;
                    break;
                }
            }
            for (var i = 0; i < currentFloor; ++i) {
                if (elevator.floorPressed[i]) {
                    hasDown = true;
                    break;
                }
            }

            if (elevator.currentDir == 1 && hasUp) {
                SetupElevatorDirection(elevator, 1);
            }
            else if (elevator.currentDir == -1 && hasDown){
                SetupElevatorDirection(elevator, -1);
            }
            else if (hasUp) {
                SetupElevatorDirection(elevator, 1)
            }
            else if (hasDown) {
                SetupElevatorDirection(elevator, -1)
            }
            else {
                SetupElevatorDirection(elevator, 0);
            }
        }

        for (var i = 0; i < numElevators; i++) {
            var elevator = elevators[i];
            (function(elevator) {
                SetupElevator(elevator);

                elevator.on("idle", function() {
                    //elevator.goToFloor((elevator.currentFloor() + 1) % numFloors);
                    
                    elevator.currentDir = 0;
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(true);

                });

                elevator.on("floor_button_pressed", function(floorNum) {
                    elevator.floorPressed[floorNum] = true;
                    SetupElevatorDestinations(elevator);
                });

                elevator.on("passing_floor", function(floorNum, direction) {
                });

                elevator.on("stopped_at_floor", function(floorNum) {
                    elevator.floorPressed[floorNum] = false;
                    SetupElevatorDestinations(elevator);
                    // TODO we may not want to turn on all directions here if turning idle, since it encourages people on both sides to board
                });
            })(elevator);
        };

        function TryScheduleElevator(elevator, dir, floorNum) {
            var score = 0;

            var floorDir = floorNum > elevator.currentFloor() ? 1 : (floorNum < elevator.currentFloor() ? -1 : 0);

            if (elevator.currentDir == 0) {
                score = 10; // always schedule idle first. TODO maybe compare with distance? need to worry about other elevators overflowing though
            }
            else if (floorDir == dir && elevator.currentDir == dir) {
                score = 5; // on the way
            }
            else { // TODO add not on the way, BUT last stop
                score = 1;
            }
            return score;
        }

        function ScheduleBestElevator(dir, floorNum) {
            var curScore = 0;
            var curBestElevator = elevators[0];
            for (var i = 0; i < numElevators; i++) { // TODO add some randomness? since we re not accounting for distance etc, random helps mix up which elevator to pick. Can make starting index random plus tie break random
                var score = TryScheduleElevator(elevators[i], 1, curFloorNum);
                if (score > curScore) {
                    curScore = score;
                    curBestElevator = elevators[i];
                }
            }
            ScheduleElevator(curBestElevator, dir, floorNum);
        }

        function ScheduleElevator(elevator, dir, floorNum) {
            elevator.floorPressed[floorNum] = true;
            SetupElevatorDestinations(elevator);
        }

        for (var curFloorNum = 0; curFloorNum < numFloors; curFloorNum++) {
            (function(curFloorNum) {
                var curFloor = floors[curFloorNum];
                curFloor.on('up_button_pressed', function() {
                    //curFloor.upPressed = true; // TODO need to delay the scheduling till later if we can't do it now, since otherwise we're making unncessary stops

                    ScheduleBestElevator(1, curFloorNum);
                });
                curFloor.on('down_button_pressed', function() {
                    //curFloor.downPressed = true;
                    ScheduleBestElevator(-1, curFloorNum);
                });
            })(curFloorNum);
        }
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
