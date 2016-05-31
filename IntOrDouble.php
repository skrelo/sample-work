<?php
if ( isset ( $argv[1] ) && !empty( $argv[1]) ) {
        $string = $argv[1] + 0;
        if( is_numeric( $string ) ) {
                if( is_float( $string ) ) {
                        echo "String is Double\n";
                        die();
                }elseif( is_int( $string) ) {
                        echo "String is Int\n";
                        die();
                }
        } 
}
echo "String is not Int or Double\n";
