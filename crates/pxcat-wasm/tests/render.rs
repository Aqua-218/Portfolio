use pxcat_wasm::{parse_coat, parse_frame, render};

/// モックのpxcats.jsのsvg()が返した文字列と比べる。
fn same_as_mock(frames: &[&str], coat: &str, pixel: usize, fixture: &str) {
    let names: Vec<_> = frames.iter().map(|f| parse_frame(f).unwrap()).collect();
    let got = render(&names, parse_coat(coat).unwrap(), pixel);
    assert_eq!(got, fixture, "{frames:?} {coat} {pixel}");
}

#[test]
fn ロゴの黒猫() {
    same_as_mock(
        &["peek", "peekBlink"],
        "kuro",
        4,
        include_str!("fixtures/peek-kuro-4.svg"),
    );
}

#[test]
fn 幕の上を走る黒猫() {
    same_as_mock(
        &["runA", "runB"],
        "kuro",
        5,
        include_str!("fixtures/run-kuro-5.svg"),
    );
}

#[test]
fn 座る三毛() {
    same_as_mock(
        &["sitA", "sitB"],
        "mike",
        3,
        include_str!("fixtures/sit-mike-3.svg"),
    );
}

#[test]
fn キジのしっぽ() {
    same_as_mock(
        &["tailA", "tailB"],
        "kiji",
        3,
        include_str!("fixtures/tail-kiji-3.svg"),
    );
}

#[test]
fn 寝る三毛() {
    same_as_mock(
        &["sleep"],
        "mike",
        3,
        include_str!("fixtures/sleep-mike-3.svg"),
    );
}

#[test]
fn 知らない名前は受け取らない() {
    assert!(parse_frame("jump").is_none());
    assert!(parse_coat("sabi").is_none());
}

#[test]
fn 足したコマと毛色も受け取る() {
    for name in [
        "groomA", "groomB", "loaf", "stretch", "rollA", "rollB", "pounceA", "pounceB",
    ] {
        assert!(parse_frame(name).is_some(), "{name}");
    }
    assert!(parse_coat("chatora").is_some());
    assert!(parse_coat("shiro").is_some());
}
