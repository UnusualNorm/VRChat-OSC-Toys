import styles from "../../styles/Home/Menu.module.css";

const toys = [
  {
    name: "MidiAtar",
    image:
      "https://api.vrchat.cloud/api/1/image/file_f2060e7f-44f1-49ce-bbbf-78c0307072c5/1/256",
    link: "/MidiAtar",
  },
  {
    name: "OuijAtar",
    image:
      "https://api.vrchat.cloud/api/1/image/file_3eda0fd7-88a0-4ffb-bd99-b73148c0e482/1/256",
    link: "/ouijatar",
  },
];

const ColumnEntries = (col: number) => {
  const entries = toys.filter((_, i) => i == col - 1);
  return entries.map((entry) => (
    <div
      className={`${styles.container} ${styles.avatar} ${styles.zoom}`}
      onClick={() => (location.href = entry.link)}
      key={entry.link}
    >
      <img src={entry.image} className={styles.image} />
      <div className={styles.overlay}>{entry.name}</div>
    </div>
  ));
};

const HomeMenu = () => (
  <div className={styles.row}>
    <div className={styles.column}>{ColumnEntries(1)}</div>
    <div className={styles.column}>{ColumnEntries(2)}</div>
    <div className={styles.column}>{ColumnEntries(3)}</div>
    <div className={styles.column}>{ColumnEntries(4)}</div>
  </div>
);

export default HomeMenu;
