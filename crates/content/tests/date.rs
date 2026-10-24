use content::date::{Date, YearMonth, days_in_month};

#[test]
fn 日付を読む() {
    assert_eq!(
        Date::parse("2026-08-10"),
        Some(Date {
            year: 2026,
            month: 8,
            day: 10
        })
    );
    for bad in [
        "2026-8-10",
        "2026-08-1",
        "2026-13-01",
        "2026-02-29",
        "2026-04-31",
        "26-08-10",
        "2026-08-10-1",
        "２０２６-08-10",
        "",
    ] {
        assert_eq!(Date::parse(bad), None, "{bad}");
    }
    assert!(Date::parse("2028-02-29").is_some());
}

#[test]
fn うるう年() {
    assert_eq!(days_in_month(2024, 2), 29);
    assert_eq!(days_in_month(2100, 2), 28);
    assert_eq!(days_in_month(2000, 2), 29);
}

#[test]
fn 年度は4月に始まる() {
    assert_eq!(Date::parse("2026-01-07").unwrap().fiscal_year(), 2025);
    assert_eq!(Date::parse("2026-03-31").unwrap().fiscal_year(), 2025);
    assert_eq!(Date::parse("2026-04-01").unwrap().fiscal_year(), 2026);
}

#[test]
fn 年月を読む() {
    assert_eq!(
        YearMonth::parse("2022-11"),
        Some(YearMonth {
            year: 2022,
            month: 11
        })
    );
    assert_eq!(YearMonth::parse("2022-13"), None);
    assert_eq!(YearMonth::parse("2022-1"), None);
}
