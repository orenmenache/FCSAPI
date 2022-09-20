function getLastTradingDay(date: Date) {
    const oneDay = 24 * 60 * 60 * 1000;
    const dateDay = date.getDay();
    const targetDate = date;
    let daysToSubtract = 0;
    switch (dateDay) {
        case 0: {
            // Given date is Sunday. We need Friday
            daysToSubtract = 2;
            break;
        }
        case 1: {
            // Given date is Monday. We need Friday
            daysToSubtract = 1;
            break;
        }

        default: {
            // Given
        }
    }
}
