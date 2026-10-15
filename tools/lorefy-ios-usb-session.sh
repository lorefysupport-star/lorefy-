#!/bin/sh
# Keep WSL's device services alive only while an iOS USB device is attached.
# No automatic attach, pairing, device registration, signing, or installation.
missing_checks=0
while [ "$missing_checks" -lt 4 ]; do
    mobile_present=0
    for vendor_file in /sys/bus/usb/devices/*/idVendor; do
        [ -r "$vendor_file" ] || continue
        [ "$(cat "$vendor_file")" = 05ac ] || continue
        product_file="${vendor_file%idVendor}idProduct"
        [ -r "$product_file" ] || continue
        case "$(cat "$product_file")" in
            12*) mobile_present=1; break ;;
        esac
    done
    if [ "$mobile_present" -eq 1 ]; then
        missing_checks=0
    else
        missing_checks=$((missing_checks + 1))
    fi
    sleep 5
done
