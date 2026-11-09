import { CloudReady } from "../../uat/BuyerDataControls";
import { AddressPicker, useDelivery } from "../procurement/AddressPicker";
import "./address-management.css";

/** The account page and checkout edit the same per-user cloud address book. */
export default function AddressManagement() {
  const delivery = useDelivery();
  return <CloudReady><section className="v3-account-panel account-address-management">
    <AddressPicker delivery={delivery} management />
  </section></CloudReady>;
}
