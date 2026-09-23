import Image from "next/image";
import styles from "../Transactions.module.css";

// Vectors for the two lower mockup cards (nodes 2665:554 and 2665:585),
// resolved through public/assets/manifest.json.
import glowEllipseSrc from "../../../../public/assets/0ccc8eb7da3595060ddee87e51e7df651a0a7e5ebe156bea393ab3d49eeb05ae.svg";
import textureLargeSrc from "../../../../public/assets/060b173bf1ddb9be5d4eed2c26354ca81a44ca1b7fc6f2998779cbc41594360a.svg";
import textureSmallSrc from "../../../../public/assets/6890ebcd6cb799da9802d3dd91c170eb0c9f2ba4835725593d8cbca3a2cc3e5a.svg";
import arrowOnLightSrc from "../../../../public/assets/524efdf462d73e50644b1ce7358509ce1eede93574ae15cf5ad0e3bd17576cfa.svg";
import arrowOnDarkSrc from "../../../../public/assets/eea8985a419e2c06299feabd47ccb86860d46bbd173e52cf9fb6a2c939d3416a.svg";
import planMarkEssentialSrc from "../../../../public/assets/5ddf73a4745fd21190217667972e7989eee47dda162cd84705f1fd947276a801.svg";
import planMarkProSrc from "../../../../public/assets/d5e1da223ddfeb66b1ae37c211421945589ecffc002e9ca367432fe465bcce30.svg";

const PLANS = [
  {
    name: "Essential Plan",
    description: "Perfect for everyday budgeting and expense tracking.",
    price: "$58.00",
    mark: planMarkEssentialSrc,
  },
  {
    name: "Soniq Pro",
    description: "Unlock advanced insights, automation, and premium support.",
    price: "$88.00",
    mark: planMarkProSrc,
  },
];

export function BalanceCard() {
  return (
    <div className={styles.cardRow} aria-hidden="true">
      <div className={styles.balanceCard}>
        <Image
          src={glowEllipseSrc}
          alt=""
          width={361}
          height={230}
          className={styles.balanceGlow}
        />
        <div className={styles.balanceTextureLarge}>
          <Image
            src={textureLargeSrc}
            alt=""
            width={397}
            height={323}
            className={styles.balanceTextureImage}
          />
        </div>
        <div className={styles.balanceTextureSmall}>
          <Image
            src={textureSmallSrc}
            alt=""
            width={298}
            height={238}
            className={styles.balanceTextureImage}
          />
        </div>

        <div className={styles.balanceCopy}>
          <p className={styles.balanceHeading}>Your Available Balance</p>
          <p className={styles.balanceBody}>
            View your available funds in real time and stay in control of your
            finances.
          </p>
        </div>

        <div className={styles.balanceTile}>
          <div className={styles.balanceTileInner}>
            <span className={styles.balanceLabel}>Soniq Case Main Balence</span>
            <p className={styles.balanceValue} data-countup>$1,234.00</p>

            <div className={styles.balanceMeta}>
              <span className={styles.balanceMetaCol}>
                <span className={styles.balanceMetaLabel}>Neopay Nmber</span>
                <span className={styles.balanceMetaValue}>
                  **** **** **** **** 6122
                </span>
              </span>
              <span className={styles.balanceMetaCol}>
                <span className={styles.balanceMetaLabel}>98%</span>
                <span
                  className={`${styles.balanceMetaValue} ${styles.balanceMetaValueLarge}`}
                >
                  **** **** **** **** 6122
                </span>
              </span>
            </div>

            <div className={styles.balanceActions}>
              <span className={`${styles.balanceChip} ${styles.balanceChipGhost}`}>
                <span className={styles.balanceChipLabel}>Transfer</span>
                <span
                  className={`${styles.balanceChipDot} ${styles.balanceChipDotLight}`}
                >
                  <Image
                    src={arrowOnLightSrc}
                    alt=""
                    width={12}
                    height={12}
                    className={styles.balanceChipIcon}
                  />
                </span>
              </span>
              <span className={`${styles.balanceChip} ${styles.balanceChipLight}`}>
                <span className={styles.balanceChipLabel}>Withdaw</span>
                <span
                  className={`${styles.balanceChipDot} ${styles.balanceChipDotDark}`}
                >
                  <Image
                    src={arrowOnDarkSrc}
                    alt=""
                    width={12}
                    height={12}
                    className={styles.balanceChipIcon}
                  />
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.planCard}>
        <div className={styles.planCopy}>
          <p className={styles.planHeading}>
            Choose a payment plan
            <br />
            that works for you
          </p>
          <p className={styles.planBody}>
            Upgrade anytime and unlock smarter financial management tools.
          </p>
        </div>

        <div className={styles.planTiles}>
          <ul className={styles.planTileList}>
            {PLANS.map((plan) => (
              <li key={plan.name} className={styles.planTile}>
                <span className={styles.planTileMain}>
                  <Image
                    src={plan.mark}
                    alt=""
                    width={18}
                    height={18}
                    className={styles.planTileIcon}
                  />
                  <span className={styles.planTileText}>
                    <span className={styles.planTileName}>{plan.name}</span>
                    <span className={styles.planTileDesc}>
                      {plan.description}
                    </span>
                  </span>
                </span>
                <span className={styles.planTilePrice}>{plan.price}</span>
              </li>
            ))}
          </ul>

          <span className={styles.planCta}>
            <span className={styles.planCtaLabel}>Continue with Pro</span>
            <span className={styles.planCtaDot}>
              <Image
                src={arrowOnLightSrc}
                alt=""
                width={12}
                height={12}
                className={styles.planCtaIcon}
              />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
