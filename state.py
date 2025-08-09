class TrainingState:
    def __init__(self):
        self.is_training = False
        self.current_process = None
        self.training_config = None
        self.current_stage = 1
        self.current_epoch = 0
        self.current_loss = 0.0
        self.start_time = None
        self.last_update = None
        self.loop = None

training_state = TrainingState()