use pxcat_core::frames::{ALL, FrameName, frame};
use pxcat_core::sprite::{Cell, MAX_H, MAX_W};

#[test]
fn コマの大きさがモックと同じ() {
    let sizes = [
        (FrameName::RunA, 20, 9),
        (FrameName::RunB, 20, 9),
        (FrameName::Sleep, 17, 7),
        (FrameName::SitA, 14, 12),
        (FrameName::SitB, 14, 12),
        (FrameName::TailA, 7, 4),
        (FrameName::TailB, 7, 4),
        (FrameName::Peek, 7, 6),
        (FrameName::PeekBlink, 7, 6),
    ];
    for (name, w, h) in sizes {
        let f = frame(name);
        assert_eq!((f.width, f.height), (w, h), "{name:?}");
    }
}

#[test]
fn コマの外は何もない() {
    for name in ALL {
        let f = frame(name);
        for y in 0..MAX_H {
            for x in 0..MAX_W {
                if x >= f.width || y >= f.height {
                    assert_eq!(f.cells[y][x], Cell::Empty, "{name:?} ({x}, {y})");
                }
            }
        }
        assert_eq!(f.get(f.width, 0), Cell::Empty);
        assert_eq!(f.get(0, f.height), Cell::Empty);
    }
}

#[test]
fn のぞく猫の顔() {
    // #.....#
    // ##...##
    // #######
    // #e###e#
    // ###p###
    let open = frame(FrameName::Peek);
    assert_eq!(open.get(0, 0), Cell::Fur);
    assert_eq!(open.get(1, 0), Cell::Empty);
    assert_eq!(open.get(1, 3), Cell::Eye);
    assert_eq!(open.get(5, 3), Cell::Eye);
    assert_eq!(open.get(3, 4), Cell::Nose);

    let blink = frame(FrameName::PeekBlink);
    assert_eq!(blink.get(1, 3), Cell::Closed);
    assert_eq!(blink.get(5, 3), Cell::Closed);
}

#[test]
fn 走る猫には縞と白がある() {
    let f = frame(FrameName::RunA);
    assert_eq!(f.get(6, 4), Cell::Stripe);
    assert_eq!(f.get(16, 5), Cell::White);
    assert_eq!(f.get(19, 3), Cell::Nose);
}
