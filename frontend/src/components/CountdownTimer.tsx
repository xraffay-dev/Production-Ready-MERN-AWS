import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();

      // Convert current time to PKT (UTC+5)
      const pktOffset = 5 * 60; // PKT is UTC+5
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const pktTime = new Date(utcTime + pktOffset * 60000);

      const currentHour = pktTime.getHours();
      const currentMinute = pktTime.getMinutes();
      const currentSecond = pktTime.getSeconds();

      let targetHour;

      // Determine next reset time (10 AM or 4 PM PKT)
      if (currentHour < 10) {
        targetHour = 10;
      } else if (currentHour < 16) {
        targetHour = 16;
      } else {
        targetHour = 10 + 24; // Next day 10 AM
      }

      // Calculate time difference
      let hoursLeft = targetHour - currentHour;
      let minutesLeft = 60 - currentMinute;
      let secondsLeft = 60 - currentSecond;

      // Adjust for overflow
      if (secondsLeft === 60) {
        secondsLeft = 0;
      } else {
        minutesLeft--;
      }

      if (minutesLeft < 0) {
        minutesLeft += 60;
        hoursLeft--;
      }

      if (minutesLeft === 60) {
        minutesLeft = 0;
      } else if (currentMinute !== 0 || currentSecond !== 0) {
        hoursLeft--;
      }

      // Handle negative hours (wrap to next day)
      if (hoursLeft < 0) {
        hoursLeft += 24;
      }

      return {
        hours: Math.max(0, hoursLeft),
        minutes: Math.max(0, minutesLeft),
        seconds: Math.max(0, secondsLeft),
      };
    };

    // Update immediately
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white font-bold text-xl sm:text-2xl px-3 py-2 rounded-lg min-w-[50px] sm:min-w-[60px] text-center shadow-lg">
        {String(value).padStart(2, "0")}
      </div>
      <span className="text-xs text-gray-600 mt-1 font-medium uppercase">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl border border-primary-200/50 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-primary-600 p-2 rounded-lg">
          <Clock size={20} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-bold text-primary-900 uppercase tracking-wide">
            Fresh Deals & Products In
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <span className="text-2xl font-bold text-primary-600 -mt-5">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <span className="text-2xl font-bold text-primary-600 -mt-5">:</span>
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
};

export default CountdownTimer;
