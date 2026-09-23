import Image from "next/image";
import styles from "../Transactions.module.css";

// Row icons and the hairline divider, taken from public/assets/manifest.json
// via design/sections.json's transactions.assets list (node 2665:459).
import spotifyIconSrc from "../../../../public/assets/d36202918771425c181c4742d5b65a74ce35d7c3a6ca7bf40f98ada271dd4498.svg";
import paypalIconSrc from "../../../../public/assets/ff3b31e0eece1adf95989923bb4c2663314ce1f93d5b8175acdd84fc8fac0bbb.svg";
import webflowIconSrc from "../../../../public/assets/8f080cf1d69aa1a05a0e320d47afd00bc672155f4da9a0bcb4c34e75b5890268.svg";
import amazonIconSrc from "../../../../public/assets/ffcc4164122635137255ab52c2dfc7472b7f29db9b590285c7056e544a94d19c.svg";
import cardIconSrc from "../../../../public/assets/65a1443029bf87c73865c8fbfd3dbfb0643a81be4aeecbf42200300fb0ac8db7.svg";
import dividerSrc from "../../../../public/assets/647b035783dda3259ae08ea949e3d764bfc0b668df148d44fb03362a7b23b4b9.svg";

type Transaction = {
  name: string;
  category: string;
  amount: string;
  icon: typeof spotifyIconSrc;
  // 2665:510 is the only amount the comp paints green; every other one is black.
  income?: true;
  // 2665:503 is the only row icon the comp clips to a circle.
  roundIcon?: true;
};

const TRANSACTIONS: Transaction[] = [
  {
    name: "Spotify",
    category: "Entertainment",
    amount: "-$14.99",
    icon: spotifyIconSrc,
  },
  {
    name: "PayPal Transfer",
    category: "Transfer",
    amount: "-$23.99",
    icon: paypalIconSrc,
  },
  {
    name: "Wayflow Income",
    category: "Income",
    amount: "-$53.99",
    icon: webflowIconSrc,
    income: true,
    roundIcon: true,
  },
  {
    name: "Amazon Purchase",
    category: "Shopping",
    amount: "-$32.99",
    icon: amazonIconSrc,
  },
  {
    name: "Salary Deposit",
    category: "Income",
    amount: "-$32.99",
    icon: cardIconSrc,
  },
];

export function TransactionList() {
  return (
    <div className={styles.txFrame}>
      <ul className={styles.txList}>
        {TRANSACTIONS.map((transaction, index) => (
          <li key={transaction.name} className={styles.txItem}>
            {index > 0 ? (
              <div className={styles.txDivider}>
                <Image
                  src={dividerSrc}
                  alt=""
                  width={338}
                  height={1}
                  className={styles.txDividerLine}
                />
              </div>
            ) : null}

            <div className={styles.txRow}>
              <div className={styles.txIdentity}>
                <span className={styles.txIconWrap}>
                  <Image
                    src={transaction.icon}
                    alt=""
                    width={24}
                    height={24}
                    className={
                      transaction.roundIcon
                        ? `${styles.txIcon} ${styles.txIconRound}`
                        : styles.txIcon
                    }
                  />
                </span>
                <span className={styles.txText}>
                  <span className={styles.txName}>{transaction.name}</span>
                  <span className={styles.txCategory}>
                    {transaction.category}
                  </span>
                </span>
              </div>
              <span
                className={
                  transaction.income
                    ? `${styles.txAmount} ${styles.txAmountIncome}`
                    : styles.txAmount
                }
              >
                {transaction.amount}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
