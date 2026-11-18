if(window.mqIsBanned&&mqIsBanned())mqBanned();else if(!state.user)welcome();else if(!state.guideDone)guide();else go('menu');
