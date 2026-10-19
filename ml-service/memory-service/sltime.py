"""
The clock of the memory service, always in Sri Lanka time (UTC+05:30).

The service stores and speaks times as plain local times ("2026-10-19T15:58:00")
and the patients are in Sri Lanka, so "now" must be Sri Lanka time whatever
the host's timezone is (a Windows VM in UTC, a container without TZ, a laptop).

Use it exactly like the datetime module:  import sltime as datetime
Only datetime.now() (without a tz) and date.today() change; everything else
is the normal datetime module.
"""
import datetime as _dt
from datetime import *  # noqa: F401,F403 - timedelta, timezone, time, MINYEAR ...

SL_TZ = _dt.timezone(_dt.timedelta(hours=5, minutes=30), "Asia/Colombo")


class datetime(_dt.datetime):  # noqa: N801 - mirrors datetime.datetime
    @classmethod
    def now(cls, tz=None):
        if tz is not None:
            return super().now(tz)
        n = _dt.datetime.now(SL_TZ).replace(tzinfo=None)
        return cls(n.year, n.month, n.day, n.hour, n.minute, n.second, n.microsecond)

    @classmethod
    def today(cls):
        return cls.now()


class date(_dt.date):  # noqa: N801 - mirrors datetime.date
    @classmethod
    def today(cls):
        n = datetime.now()
        return cls(n.year, n.month, n.day)
